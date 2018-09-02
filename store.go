package main

import (
	"encoding/binary"
	"encoding/json"

	"github.com/dgraph-io/badger"
	"github.com/dgraph-io/badger/options"
	proto "github.com/golang/protobuf/proto"
	"github.com/jackdoe/go-metno"
	. "github.com/jackdoe/weather/log"
	pb "github.com/jackdoe/weather/spec"
	"io/ioutil"
	"math/rand"
	"os"
	"runtime"
	"time"
)

const precision = 3

func Round(x, unit float32) float32 {
	if x > 0 {
		return float32(int64(x/unit+0.5)) * unit
	}
	return float32(int32(x/unit-0.5)) * unit
}

type store struct {
	db *badger.DB
}

func NewStore(path string) *store {
	opts := badger.LSMOnlyOptions
	opts.ValueLogLoadingMode = options.FileIO
	opts.NumCompactors = 1
	opts.Dir = path
	opts.ValueDir = path
	db, err := badger.Open(opts)

	os.MkdirAll(path, 0755)

	if err != nil {
		panic(err)
	}

	go func() {
		ticker := time.NewTicker(5 * time.Minute)
		defer ticker.Stop()
		for range ticker.C {
		again:
			err := db.RunValueLogGC(0.7)
			runtime.GC()
			if err == nil {
				goto again
			}
		}
	}()

	return &store{
		db: db,
	}
}

func (s *store) close() {
	s.db.Close()
}
func (s *store) normalizeLatLng(x float32) float32 {
	return Round(x, .5)
}
func (s *store) normalizeWeatherKey(k *pb.WeatherStoreKey) {
	if k.Timestamp == 0 {
		k.Timestamp = currentHour() + 3600
	}

	k.Lat = s.normalizeLatLng(k.Lat)
	k.Lng = s.normalizeLatLng(k.Lng)
}

func (s *store) getStoredWeather(k *pb.WeatherStoreKey) (*pb.WeatherStoreValue, error) {
	txn := s.db.NewTransaction(false)

	defer txn.Discard()

	dataK := s.encodeKeyFixedSize(k.Lat, k.Lng, k.Timestamp)
	found, err := txn.Get(dataK)
	if err != nil {
		return nil, err
	}
	if found == nil {
		return nil, nil
	}
	dataV, err := found.Value()
	if err != nil {
		return nil, err
	}

	out := &pb.WeatherStoreValue{}
	err = proto.Unmarshal(dataV, out)
	if err != nil {
		return nil, err
	}
	return out, nil
}

func (s *store) encodeKeyFixedSize(lat, lng float32, ts uint32) []byte {
	b := make([]byte, 12)
	binary.BigEndian.PutUint32(b[0:], ts)
	binary.BigEndian.PutUint32(b[4:], uint32(lat*10000))
	binary.BigEndian.PutUint32(b[8:], uint32(lng*10000))

	return b
}

func (s *store) decodeKeyFixedSize(b []byte) *pb.WeatherStoreKey {
	ts := binary.BigEndian.Uint32(b[0:])
	lat := int32(binary.BigEndian.Uint32(b[4:]))
	lng := int32(binary.BigEndian.Uint32(b[8:]))

	return &pb.WeatherStoreKey{
		Lat:       float32(lat) / 10000,
		Lng:       float32(lng) / 10000,
		Timestamp: ts,
	}
}

func (s *store) scan(from uint32, cb func(*pb.WeatherStoreKey, *pb.WeatherStoreValue) error) error {
	txn := s.db.NewTransaction(false)
	defer txn.Discard()
	opts := badger.DefaultIteratorOptions
	it := txn.NewIterator(opts)

	defer it.Close()
	from = closestHourInt(from - 3600)
	to := closestHourInt(from)
	prefix := s.encodeKeyFixedSize(0, 0, from)

	for it.Seek(prefix); it.Valid(); it.Next() {
		item := it.Item()
		ik := item.Key()
		iv, err := item.Value()
		if err != nil {
			return err
		}

		k := s.decodeKeyFixedSize(ik)
		if k.Timestamp > to {
			return nil
		}
		v := &pb.WeatherStoreValue{}
		err = proto.Unmarshal(iv, v)
		if err != nil {
			return err
		}

		err = cb(k, v)
		if err != nil {
			return err
		}
	}
	return nil
}

func (s *store) deleteOld() error {

	txn := s.db.NewTransaction(true)
	opts := badger.DefaultIteratorOptions
	opts.PrefetchValues = false
	it := txn.NewIterator(opts)
	defer it.Close()
	log := Log()
	past := currentHour() - (3600 * 24)
	n := 0
	for it.Rewind(); it.Valid(); it.Next() {
		item := it.Item()
		ik := item.Key()
		k := s.decodeKeyFixedSize(ik)

		if k.Timestamp < past {
			log.Infof("delete %+v past: %d", k, past)
			err := txn.Delete(item.Key())
			if err != nil {
				return err
			}
			n++
			if n > 10000 {
				return txn.Commit(nil)
			}
		}
	}

	return s.db.RunValueLogGC(0.7)
}

func (s *store) storeMetNo(input *metno.MetNoWeatherOutput) error {
	return s.db.Update(func(txn *badger.Txn) error {
		if input.Product == nil || input.Product.Time == nil {
			return nil
		}
		log := Log()
		for _, v := range input.Product.Time {
			if v.Location == nil || v.Location.Temperature == nil {
				continue

			}
			value := &pb.WeatherStoreValue{
				UpdatedTimestamp: now(),
				From:             uint32(v.From.Unix()),
				To:               uint32(v.To.Unix()),
			}

			if v.Location.Humidity != nil {
				value.HumidityPercent = float32(v.Location.Humidity.Value)
			}

			if v.Location.Fog != nil {
				value.FogPercent = float32(v.Location.Fog.Percent)
			}

			if v.Location.Cloudiness != nil {
				value.CloudinessPercent = float32(v.Location.Cloudiness.Percent)
			}

			if v.Location.LowClouds != nil {
				value.LowCloudsPercent = float32(v.Location.LowClouds.Percent)
			}

			if v.Location.HighClouds != nil {
				value.HighCloudsPercent = float32(v.Location.HighClouds.Percent)
			}

			if v.Location.MediumClouds != nil {
				value.MediumCloudsPercent = float32(v.Location.MediumClouds.Percent)
			}

			if v.Location.WindSpeed != nil {
				value.WindSpeedMps = float32(v.Location.WindSpeed.Mps)
			}

			if v.Location.WindGust != nil {
				value.WindGustMps = float32(v.Location.WindGust.Mps)
			}

			if v.Location.AreaMaxWindSpeed != nil {
				value.AreaMaxWindSpeedMps = float32(v.Location.AreaMaxWindSpeed.Mps)
			}

			if v.Location.WindDirection != nil {
				value.WindDirectionDeg = float32(v.Location.WindDirection.Deg)
			}

			if v.Location.Pressure != nil {
				value.PressureHPA = float32(v.Location.Pressure.Value)
			}

			if v.Location.TemperatureProbability != nil {
				value.TemperatureProbability = float32(v.Location.TemperatureProbability.Value)
			}

			if v.Location.WindProbability != nil {
				value.WindProbability = float32(v.Location.WindProbability.Value)
			}

			if v.Location.DewpointTemperature != nil {
				value.DewpointTemperatureC = float32(v.Location.DewpointTemperature.Value)
			}

			value.TemperatureC = float32(v.Location.Temperature.Value)

			key := &pb.WeatherStoreKey{
				Timestamp: closestHour(v.From),
				Lat:       float32(v.Location.Latitude),
				Lng:       float32(v.Location.Longitude),
			}

			dataK := s.encodeKeyFixedSize(key.Lat, key.Lng, key.Timestamp)
			dataV, err := proto.Marshal(value)
			if err != nil {
				return err
			}

			err = txn.Set(dataK, dataV)

			if err != nil {
				return err
			}
			log.Infof("%+v temp: %.2f", key, value.TemperatureC)
		}
		return nil
	})

}

type locationsLatLng struct {
	Lat float64 `json:"lat,omitempty"`
	Lng float64 `json:"lng,omitempty"`
}

func Shuffle(vals []*locationsLatLng) {
	r := rand.New(rand.NewSource(time.Now().Unix()))
	for len(vals) > 0 {
		n := len(vals)
		randIndex := r.Intn(n)
		vals[n-1], vals[randIndex] = vals[randIndex], vals[n-1]
		vals = vals[:n-1]
	}
}

// list of cities taken from curl http://download.maxmind.com/download/worldcities/worldcitiespop.txt.gz \
// | gzip -d - \
// | awk -F "," '{print $6 "#" $7}' \
// | perl -e perl -e 'use Math::Round; while(<>) { my ($lat,$lng) = split /#/,$_; printf("{\"lat\": %.1f, \"lng\": %.1f},\n", nearest(0.5,$lat),nearest(0.5,$lng)); ;}; \
// | sort | uniq | sed -e 's/^/[/g' | sed -e 's/$/]/g'
func (s *store) updateLocations(locationsFile string) error {
	log := Log()
	client := metno.SimpleClient(10)
	locations := []*locationsLatLng{}
	content, err := ioutil.ReadFile(locationsFile)
	if err != nil {
		log.Fatal(err)
	}
	err = json.Unmarshal(content, &locations)
	if err != nil {
		log.Fatal(err)
	}

	for {
		Shuffle(locations)
		for _, location := range locations {

			lat := s.normalizeLatLng(float32(location.Lat))
			lng := s.normalizeLatLng(float32(location.Lng))

			out, err := metno.LocationForecast(client, float64(lat), float64(lng), 0)
			if err != nil {
				log.Infof("failed to get data for %.2f/%.2f %s", lat, lng, err.Error())
				continue
			}
			err = s.storeMetNo(out)
			if err != nil {
				log.Infof("failed to store data for %.2f/%.2f %s", lat, lng, err.Error())
				continue
			}
			time.Sleep(2 * time.Second)
		}
	}
	return nil
}
