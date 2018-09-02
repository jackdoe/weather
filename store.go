package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	_ "github.com/go-sql-driver/mysql"
	"github.com/jackdoe/go-metno"
	. "github.com/jackdoe/weather/log"
	pb "github.com/jackdoe/weather/spec"
	_ "github.com/mattn/go-sqlite3"
	"github.com/xo/dburl"
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
	db *sql.DB
}

func NewStore(url string) *store {
	db, err := dburl.Open(url)
	if err != nil {
		panic(err)
	}

	db.SetMaxOpenConns(1)
	statement, err := db.Prepare(`
        CREATE TABLE IF NOT EXISTS weather (
             id bigint PRIMARY KEY,
             _from int unsigned not null,
             _to int unsigned not null,
             altitude float not null,
             fogPercent float not null,
             pressureHPA float not null,
             cloudinessPercent float not null,
             windDirectionDeg float not null,
             dewpointTemperatureC  float not null,
             windGustMps  float not null,
             humidityPercent  float not null,
             areaMaxWindSpeedMps  float not null,
             windSpeedMps  float not null,
             temperatureC  float not null,
             lowCloudsPercent  float not null,
             mediumCloudsPercent  float not null,
             highCloudsPercent  float not null,
             temperatureProbability  float not null,
             windProbability  float not null,
             updatedTimestamp int unsigned not null)
        `)
	if err != nil {
		panic(err)
	}

	_, err = statement.Exec()
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

	rows, err := s.db.Query(fmt.Sprintf(`
SELECT 
    _from,
    _to,
    altitude,
    fogPercent,
    pressureHPA,
    cloudinessPercent,
    windDirectionDeg,
    dewpointTemperatureC,
    windGustMps,
    humidityPercent,
    areaMaxWindSpeedMps,
    windSpeedMps,
    temperatureC,
    lowCloudsPercent,
    mediumCloudsPercent,
    highCloudsPercent,
    temperatureProbability,
    windProbability,
    updatedTimestamp
FROM 
  weather
WHERE
  id=%d
`, dataK))
	if err != nil {
		return nil, err
	}

	v := &pb.WeatherStoreValue{}
	for rows.Next() {
		err = rows.Scan(&v.From,
			&v.To,
			&v.Altitude,
			&v.FogPercent,
			&v.PressureHPA,
			&v.CloudinessPercent,
			&v.WindDirectionDeg,
			&v.DewpointTemperatureC,
			&v.WindGustMps,
			&v.HumidityPercent,
			&v.AreaMaxWindSpeedMps,
			&v.WindSpeedMps,
			&v.TemperatureC,
			&v.LowCloudsPercent,
			&v.MediumCloudsPercent,
			&v.HighCloudsPercent,
			&v.TemperatureProbability,
			&v.WindProbability,
			&v.UpdatedTimestamp,
		)

		return v, nil
	}
	return nil, nil
}

func (s *store) encodeKeyFixedSize(lat, lng float32, ts uint32) uint64 {
	return uint64(ts)<<31 | uint64(uint16(lat*10))<<16 | uint64((uint16(lng) * 10))
}
func (s *store) decodeKeyFixedSize(b uint64) *pb.WeatherStoreKey {
	ts := uint32(b >> 31)
	lat := (b >> 16) & 0xFFFF
	lng := b & 0xFFFF

	return &pb.WeatherStoreKey{
		Lat:       float32(lat) / 10,
		Lng:       float32(lng) / 10,
		Timestamp: ts,
	}
}
func (s *store) scan(from uint32, cb func(*pb.WeatherStoreKey, *pb.WeatherStoreValue) error) error {
	fromKey := s.encodeKeyFixedSize(0, 0, closestHourInt(from))
	toKey := s.encodeKeyFixedSize(0, 0, closestHourInt(from+3600))
	rows, err := s.db.Query(fmt.Sprintf(`
SELECT 
    id,
    _from,
    _to,
    altitude,
    fogPercent,
    pressureHPA,
    cloudinessPercent,
    windDirectionDeg,
    dewpointTemperatureC,
    windGustMps,
    humidityPercent,
    areaMaxWindSpeedMps,
    windSpeedMps,
    temperatureC,
    lowCloudsPercent,
    mediumCloudsPercent,
    highCloudsPercent,
    temperatureProbability,
    windProbability,
    updatedTimestamp
FROM 
  weather
WHERE
  id >= %d AND id < %d
`, fromKey, toKey))
	if err != nil {
		return err
	}
	for rows.Next() {
		v := &pb.WeatherStoreValue{}
		var id uint64
		err = rows.Scan(&id,
			&v.From,
			&v.To,
			&v.Altitude,
			&v.FogPercent,
			&v.PressureHPA,
			&v.CloudinessPercent,
			&v.WindDirectionDeg,
			&v.DewpointTemperatureC,
			&v.WindGustMps,
			&v.HumidityPercent,
			&v.AreaMaxWindSpeedMps,
			&v.WindSpeedMps,
			&v.TemperatureC,
			&v.LowCloudsPercent,
			&v.MediumCloudsPercent,
			&v.HighCloudsPercent,
			&v.TemperatureProbability,
			&v.WindProbability,
			&v.UpdatedTimestamp,
		)
		k := s.decodeKeyFixedSize(id)
		err = cb(k, v)
		if err != nil {
			return err
		}
	}
	return nil
}
func (s *store) storeKeyValue(key *pb.WeatherStoreKey, value *pb.WeatherStoreValue) error {
	statement, err := s.db.Prepare(`
REPLACE INTO weather (
    id,
    _from,
    _to,
    altitude,
    fogPercent,
    pressureHPA,
    cloudinessPercent,
    windDirectionDeg,
    dewpointTemperatureC,
    windGustMps,
    humidityPercent,
    areaMaxWindSpeedMps,
    windSpeedMps,
    temperatureC,
    lowCloudsPercent,
    mediumCloudsPercent,
    highCloudsPercent,
    temperatureProbability,
    windProbability,
    updatedTimestamp
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
	if err != nil {
		return err
	}
	dataK := s.encodeKeyFixedSize(key.Lat, key.Lng, key.Timestamp)
	_, err = statement.Exec(dataK,
		value.From,
		value.To,
		value.Altitude,
		value.FogPercent,
		value.PressureHPA,
		value.CloudinessPercent,
		value.WindDirectionDeg,
		value.DewpointTemperatureC,
		value.WindGustMps,
		value.HumidityPercent,
		value.AreaMaxWindSpeedMps,
		value.WindSpeedMps,
		value.TemperatureC,
		value.LowCloudsPercent,
		value.MediumCloudsPercent,
		value.HighCloudsPercent,
		value.TemperatureProbability,
		value.WindProbability,
		value.UpdatedTimestamp)
	return err
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
		err := s.storeKeyValue(key, value)
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
