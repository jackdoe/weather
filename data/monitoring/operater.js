const _ = require("lodash");
const axios = require("axios");
const Promise = require("bluebird");
const fs = require("fs");

const uaeLocations = require("./uaeCities");

const metNoUrl = "https://api.met.no/weatherapi/locationforecast/1.9/?";
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

      const firstHour = locWeatherJson.HOURLY_FORECAST[0];
      const weather = {};
      weather.tempC = firstHour.TEMPERATURE;
      weather.pressure = firstHour.PRESSURE;
      weather.humidity = firstHour.HUMIDITY;
      weather.windSpeed = firstHour.WIND_SPEED;
      weather.time = new Date(firstHour.TIME_UTC).getTime() / 1000;

      return { location, weather };
    });
}

// Pick random 5 cities from UAE list
const selectedLocations = _.sampleSize(uaeLocations, 5);

Promise.mapSeries(selectedLocations, loc =>
  Promise.all([
    //getLocationWeatherFromMetNo(loc),
    getUaeWeatherDataFromOfficialAgency(loc)
  ])
).then(locationsWeather => {
  const allCities = [];
  allCities.push(locationsWeather);
  fs.writeFileSync(
    "./hourlyWeather.json",
    JSON.stringify(allCities, null, 2),
    "utf8"
  );

  let stats = { latLong: [] };
  const time = allCities[0][0][0].weather.time;

  for (let prop of allCities[0]) {
    const { tempC, pressure, humidity, windSpeed } = prop[0].weather;
    const { lat, lng } = prop[0].location;
    stats = {
      sumOfTemp: stats.sumOfTemp + tempC || tempC,
      sumOfPressure: stats.sumOfPressure + pressure || pressure,
      sumOfHumidity: stats.sumOfHumidity + humidity || humidity,
      sumOfWindSpeed: stats.sumOfWindSpeed + windSpeed || windSpeed,
      timeStamp: time,
      latLng: stats.latLng ? [...stats.latLng, { lat, lng }] : [{ lat, lng }]
    };
  }

  fs.writeFileSync(
    `./stats/stats_${time}.json`,
    JSON.stringify(stats, null, 2),
    "utf8"
  );
});
