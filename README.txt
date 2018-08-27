
* hosted at https://freeweatherapi.com
* free weather api based on https://api.met.no, uses embedded leveldb to store 
* data is updated daily, and the lat/lng resolution is +-100km (rounded lat/lng)

* how to run locally:
$ go run *.go -help # will give the command line options
    -grpcBind string
      	bind for grpc endpoints (default ":9090")
    -httpBind string
      	bind for json endpoints (proxy for grpc) (default ":8080")
    -locations string
      	file filled with locations to update (default "data/cities.json")
    -root string
      	weather storage root directory (default "/tmp/weather")

Example:

curl -XPOST -s -d '{"locations":[{"lat":-1,"lng":-45.5, "timestamp":1535551200}]}' https://freeweatherapi.com/v1/query | json_pp
{
   "locations" : [
      {
         "weather" : {
            "windSpeed" : {
               "id" : "ff",
               "beaufort" : "4",
               "name" : "Laber bris",
               "mps" : 6.4
            },
            "fog" : {
               "id" : "FOG"
            },
            "windDirection" : {
               "id" : "dd",
               "deg" : 114.7,
               "name" : "SE"
            },
            "cloudiness" : {
               "percent" : 78.9,
               "id" : "NN"
            },
            "lng" : -175,
            "mediumClouds" : {
               "percent" : 11.7,
               "id" : "MEDIUM"
            },
            "to" : 1535284800,
            "highClouds" : {
               "percent" : 75,
               "id" : "HIGH"
            },
            "updatedTimestamp" : 1535281470,
            "lowClouds" : {
               "percent" : 32,
               "id" : "LOW"
            },
            "dewpointTemperature" : {
               "id" : "TD",
               "unit" : "celsius",
               "value" : 23.6
            },
            "pressure" : {
               "unit" : "hPa",
               "value" : 1011.2,
               "id" : "pr"
            },
            "from" : 1535284800,
            "humidity" : {
               "unit" : "percent",
               "value" : 80.7
            },
            "temperature" : {
               "value" : 26.9,
               "unit" : "celsius",
               "id" : "TTT"
            }
         },
         "location" : {
            "timestamp" : 1535284800,
            "lng" : -175
         }
      }
   ],
   "license" : "Based on data from MET Norway, License: https://api.met.no/license_data.html"
}

