package main

import (
	"encoding/binary"
	"encoding/json"
	proto "github.com/golang/protobuf/proto"
	"github.com/jackdoe/go-metno"
	. "github.com/jackdoe/weather/log"
	pb "github.com/jackdoe/weather/spec"
	"github.com/syndtr/goleveldb/leveldb"
	"github.com/syndtr/goleveldb/leveldb/opt"
	"github.com/syndtr/goleveldb/leveldb/util"
	"io/ioutil"
	"math/rand"
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
	db *leveldb.DB
}

func NewStore(path string) *store {
	db, err := leveldb.OpenFile(path, &opt.Options{
		Compression: opt.NoCompression,
		NoSync:      true,
	})

	if err != nil {
		panic(err)
	}

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
	dataK := s.encodeKeyFixedSize(k.Lat, k.Lng, k.Timestamp)
	dataV, err := s.db.Get(dataK, nil)
	if err != nil {
		return nil, err
	}
	if dataV == nil {
		return nil, nil
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

func (s *store) setStoredWeather(k *pb.WeatherStoreKey, v *pb.WeatherStoreValue) error {
	dataK := s.encodeKeyFixedSize(k.Lat, k.Lng, k.Timestamp)
	dataV, err := proto.Marshal(v)
	if err != nil {
		return err
	}

	err = s.db.Put(dataK, dataV, nil)
	return err
}

func (s *store) scan(from, to uint32, cb func(*pb.WeatherStoreKey, *pb.WeatherStoreValue) error) error {
	iter := s.db.NewIterator(&util.Range{Start: s.encodeKeyFixedSize(0, 0, closestHourInt(from)), Limit: s.encodeKeyFixedSize(0, 0, closestHourInt(to))}, nil)

	for iter.Next() {
		k := s.decodeKeyFixedSize(iter.Key())

		v := &pb.WeatherStoreValue{}
		err := proto.Unmarshal(iter.Value(), v)
		if err != nil {
			return err
		}

		err = cb(k, v)
		if err != nil {
			return err
		}
	}
	iter.Release()
	return iter.Error()
}

func (s *store) storeMetNo(input *metno.MetNoWeatherOutput) error {
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

		err := s.setStoredWeather(key, value)
		if err != nil {
			return err
		}
		log.Infof("%+v temp: %.2f", key, value.TemperatureC)
	}
	return nil

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
