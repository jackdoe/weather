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
          temperatureC: hourWeather.TEMPERATURE,
          temperatureFeel: hourWeather.TEMPERATURE_FEELSLIKE,
          pressureHPA: hourWeather.PRESSURE,
          humidityPercent: hourWeather.HUMIDITY,
          windSpeedMps: hourWeather.WIND_SPEED,
          windDirectionDeg: hourWeather.WIND_DIR_DEG,
          lowCloudPercent: hourWeather.LOW_CLOUD,
          medCloudPercent: hourWeather.MED_CLOUD,
          highCloudPercent: hourWeather.HIGH_CLOUD,
          dewpointTemperatureC: hourWeather.DEWPOINT_TEMPERATURE,
          from: new Date(hourWeather.TIME_UTC).getTime() / 1000
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
