const _ = require("lodash");
const axios = require("axios");
const Promise = require("bluebird");
const fs = require("fs");

const uaeLocations = require("../UAE-Monitor/uaeCities");

const weatherUrl = "http://www.uaeweather.ae/uae-weather/forecast?query=";

function getUaeWeatherDataFromOfficialAgency({ location }) {
  const locWeatherUrl = `${weatherUrl}${location.id}`;

  return axios
    .get(locWeatherUrl)
    .then(resp => resp.data)
    .then(locWeatherJson => {
      const location = {
        id: locWeatherJson.PLACE.IDENTIFIER,
        station: locWeatherJson.PLACE.NAME,
        lat: locWeatherJson.PLACE.COORDINATES[1],
        lng: locWeatherJson.PLACE.COORDINATES[0]
      };

      const weather = locWeatherJson.HOURLY_FORECAST.map(hourWeather => {
        return {
          tempC: hourWeather.TEMPERATURE,
          tempFeel: hourWeather.TEMPERATURE_FEELSLIKE,
          pressure: hourWeather.PRESSURE,
          humidity: hourWeather.HUMIDITY,
          windSpeed: hourWeather.WIND_SPEED,
          windDir: hourWeather.WIND_DIR_DEG,
          lowCloud: hourWeather.LOW_CLOUD,
          medCloud: hourWeather.MED_CLOUD,
          highCloud: hourWeather.HIGH_CLOUD,
          dewPointTemp: hourWeather.DEWPOINT_TEMPERATURE,
          time: new Date(hourWeather.TIME_UTC).getTime() / 1000
        };
      });
      return { location, weather };
    });
}

Promise.mapSeries(uaeLocations, loc =>
  getUaeWeatherDataFromOfficialAgency(loc)
).then(locationsWeather => {
  console.log(JSON.stringify(locationsWeather, null, 2));
});
