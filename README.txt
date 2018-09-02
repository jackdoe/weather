
* hosted at https://freeweatherapi.com
* free weather api based on https://api.met.no, uses embedded leveldb to store 
* we do 1 query per 2 seconds to met.no, so 45_000 locations in cities.json
  take 90_000 seconds to complete, or about 25 hours

* how to run locally:
$ go run *.go -help # will give the command line options
  -db string
    	weather database url, for example mysql://user:pass@localhost/dbname (default "sqlite:/tmp/weather.sqlite3")
  -grpcBind string
    	bind for grpc endpoints (default ":9090")
  -httpBind string
    	bind for json endpoints (proxy for grpc) (default ":8080")
  -locations string
    	file filled with locations to update (default "data/cities.json")
  -logdir string
    	weather log directory (default "/tmp/weather_log")

Example:

curl -XPOST -s -d '{"locations":[{"lat":2,"lng":-53}]}' https://freeweatherapi.com/v1/query | json_pp
{
   "locations" : [
      {
         "weather" : {
            "dewpointTemperatureC" : 24.2,
            "cloudinessPercent" : 50.8,
            "lowCloudsPercent" : 50.8,
            "windSpeedMps" : 3.6,
            "pressureHPA" : 1013.9,
            "from" : 1535889600,
            "humidityPercent" : 76.1,
            "to" : 1535889600,
            "updatedTimestamp" : 1535436757,
            "windDirectionDeg" : 91.4,
            "temperatureC" : 28.4,
            "lng" : -53,
            "lat" : 2,            
         },
         "location" : {
            "timestamp" : 1535889600,
            "lng" : -53,
            "lat" : 2
         }
      }
   ],
   "license" : "Based on data from MET Norway, License: https://api.met.no/license_data.html"
}
