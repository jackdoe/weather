package main

import (
	"errors"
	_ "expvar"
	"flag"
	"fmt"
	ew "github.com/go-errors/errors"
	"github.com/grpc-ecosystem/go-grpc-middleware"
	"github.com/grpc-ecosystem/go-grpc-middleware/logging/zap"
	"github.com/grpc-ecosystem/go-grpc-middleware/logging/zap/ctxzap"

	"github.com/grpc-ecosystem/go-grpc-middleware/recovery"
	. "github.com/jackdoe/weather/log"
	pb "github.com/jackdoe/weather/spec"
	"go.uber.org/zap"
	"path"

	"github.com/grpc-ecosystem/go-grpc-middleware/tags"
	"github.com/grpc-ecosystem/grpc-gateway/runtime"
	"github.com/rs/cors"
	"golang.org/x/net/context"
	"google.golang.org/grpc"
	"google.golang.org/grpc/reflection"
	"net"
	"net/http"
	_ "net/http/pprof"
	"os"
	"os/signal"
	"sync"
	"syscall"
	"time"
)

const maxSize = 1 * 1024 * 1024

func closestHour(t time.Time) uint32 {
	return uint32((t.Unix() / 3600) * 3600)
}

func closestHourInt(t uint32) uint32 {
	return uint32((t / 3600) * 3600)
}

func currentHour() uint32 {
	return closestHour(time.Now())
}

func now() uint32 {
	return uint32(time.Now().Unix())
}

type cached struct {
	hottest *pb.WeatherResponseItem
	coldest *pb.WeatherResponseItem
}

type server struct {
	store    *store
	httpBind string
	grpcBind string
	cached   cached
	sync.RWMutex
}

func newServer(root, httpBind, grpcBind string) *server {
	s := NewStore(path.Join(root, "database"))
	srv := &server{
		store:    s,
		grpcBind: grpcBind,
		httpBind: httpBind,
	}

	return srv
}

func (s *server) RpcQuery(ctx context.Context, in *pb.QueryRequest) (*pb.QueryResponse, error) {
	out := make([]*pb.WeatherResponseItem, len(in.Locations))
	for i, l := range in.Locations {
		s.store.normalizeWeatherKey(l)
		data, _ := s.store.getStoredWeather(l)
		out[i] = &pb.WeatherResponseItem{
			Location: l,
			Weather:  data,
		}
	}

	ctxzap.AddFields(ctx, zap.Int("itemsRequested", len(in.Locations)))

	return &pb.QueryResponse{
		Locations: out,
		License:   "Based on data from MET Norway, License: https://api.met.no/license_data.html",
	}, nil
}

func (s *server) RpcExtreme(ctx context.Context, in *pb.Empty) (*pb.ExtremeResponse, error) {
	return &pb.ExtremeResponse{
		Hottest: s.cached.hottest,
		Coldest: s.cached.coldest,
	}, nil
}

func (s *server) RpcBatch(in *pb.BatchRequest, stream pb.Weather_RpcBatchServer) error {
	if in.Timestamp == 0 {
		in.Timestamp = currentHour()
	}
	return s.store.scan(in.Timestamp, func(k *pb.WeatherStoreKey, v *pb.WeatherStoreValue) error {
		item := &pb.WeatherResponseItem{
			Location: k,
			Weather:  v,
		}

		if err := stream.Send(item); err != nil {
			return err
		}
		return nil
	})
}

func (this *server) runProxy() error {
	ctx := context.Background()
	ctx, cancel := context.WithCancel(ctx)
	defer cancel()

	mux := runtime.NewServeMux()
	opts := []grpc.DialOption{
		grpc.WithInsecure(),
		grpc.WithDefaultCallOptions(grpc.MaxCallRecvMsgSize(maxSize)),
	}

	err := pb.RegisterWeatherHandlerFromEndpoint(ctx, mux, this.grpcBind, opts)
	if err != nil {
		return err
	}
	handler := cors.Default().Handler(mux)

	return http.ListenAndServe(this.httpBind, handler)
}

func main() {
	grpc.EnableTracing = false
	var proot = flag.String("root", "/tmp/weather", "weather storage root directory")
	var phttpBind = flag.String("httpBind", ":8080", "bind for json endpoints (proxy for grpc)")
	var pgrpcBind = flag.String("grpcBind", ":9090", "bind for grpc endpoints")
	var plocations = flag.String("locations", "data/cities.json", "file filled with locations to update")
	flag.Parse()
	grpc_zap.SystemField = zap.String("gsystem", "grpc")
	CreateLogger(*proot)
	defer Zap().Sync()
	log := Log()
	zapLogger := Zap()

	srv := newServer(*proot, *phttpBind, *pgrpcBind)

	go func() {
		for {
			srv.store.deleteOld()

			var hottest *pb.WeatherResponseItem
			var coldest *pb.WeatherResponseItem
			c := closestHour(time.Now())
			srv.store.scan(c, func(k *pb.WeatherStoreKey, v *pb.WeatherStoreValue) error {
				if hottest == nil || v.TemperatureC > hottest.Weather.TemperatureC {
					hottest = &pb.WeatherResponseItem{
						Location: k,
						Weather:  v,
					}
				}

				if coldest == nil || v.TemperatureC < coldest.Weather.TemperatureC {
					coldest = &pb.WeatherResponseItem{
						Location: k,
						Weather:  v,
					}
				}
				return nil
			})

			srv.cached.hottest = hottest
			srv.cached.coldest = coldest
			time.Sleep(3600 * time.Second)
		}
	}()

	go func() {
		if err := srv.runProxy(); err != nil {
			log.Fatal(err)
		}
	}()

	go func() {
		lis, err := net.Listen("tcp", *pgrpcBind)
		if err != nil {
			log.Fatalf("failed to listen: %v", err)
		}

		grpc_zap.ReplaceGrpcLogger(zapLogger)
		opts := []grpc_zap.Option{}
		recovery_opts := []grpc_recovery.Option{
			grpc_recovery.WithRecoveryHandler(func(p interface{}) (err error) {
				return errors.New(fmt.Sprintf("panic: %+v", ew.Wrap(p, 0).ErrorStack()))
			}),
		}
		grpcServer := grpc.NewServer(
			grpc.MaxMsgSize(maxSize),
			grpc_middleware.WithUnaryServerChain(
				grpc_ctxtags.UnaryServerInterceptor(grpc_ctxtags.WithFieldExtractor(grpc_ctxtags.CodeGenRequestFieldExtractor)),
				grpc_zap.UnaryServerInterceptor(zapLogger, opts...),
				grpc_recovery.UnaryServerInterceptor(recovery_opts...),
			),
			grpc_middleware.WithStreamServerChain(
				grpc_ctxtags.StreamServerInterceptor(grpc_ctxtags.WithFieldExtractor(grpc_ctxtags.CodeGenRequestFieldExtractor)),
				grpc_zap.StreamServerInterceptor(zapLogger, opts...),
				grpc_recovery.StreamServerInterceptor(recovery_opts...),
			),
		)

		pb.RegisterWeatherServer(grpcServer, srv)

		reflection.Register(grpcServer)
		if err := grpcServer.Serve(lis); err != nil {
			log.Fatalf("failed to serve: %v", err)
		}
	}()

	go func() {
		log.Infof("%v", http.ListenAndServe("localhost:6060", nil))
	}()
	errc := make(chan error)

	go func() {
		log.Infof("waiting...")
		c := make(chan os.Signal, 1)
		signal.Notify(c, syscall.SIGINT, syscall.SIGTERM)
		errc <- fmt.Errorf("Signal %v", <-c)
	}()
	go srv.store.updateLocations(*plocations)

	log.Infof("Exit: %v", <-errc)
	log.Infof("closing %s", *proot)
	srv.store.close()
}
