const request = require("sync-request");
const sleep = require("system-sleep");

const locationUrl = "http://www.uaeweather.ae/uae-weather/locations/search";

const weatherUrl = "http://www.uaeweather.ae/uae-weather/forecast?query=";

const locationRes = request("GET", locationUrl);
const locationString = locationRes.body.toString();

const locationJson = JSON.parse(locationString);

const locationId = Object.keys(locationJson)
  .map(loc => locationJson[loc].IDENTIFIER)
  .map(locId => `${weatherUrl}${locId}`);

const locationsWeather = locationId.map(locWeatherUrl => {
  const locWeatherRes = request("GET", locWeatherUrl);
  const locWeatherStr = locWeatherRes.body.toString();
  const locWeatherJson = JSON.parse(locWeatherStr);
  const location = {
    lat: locWeatherJson.PLACE.COORDINATES[1],
    lng: locWeatherJson.PLACE.COORDINATES[0]
  };

  const weather = locWeatherJson.HOURLY_FORECAST.map(hourWeather => {
    return {
      tempC: hourWeather.TEMPERATURE_AVG,
      tempMax: hourWeather.TEMPERATURE_MAX,
      tempMin: hourWeather.TEMPERATURE_MIN,
      tempFeel: hourWeather.TEMPERATURE_FEELSLIKE,
      pressure: hourWeather.PRESSURE,
      humidity: hourWeather.HUMIDITY,
      windSpeed: hourWeather.WIND_SPEED,
      lowCloud: hourWeather.LOW_CLOUD,
      highCloud: hourWeather.HIGH_CLOUD,
      dewPointTemp: hourWeather.DEWPOINT_TEMPERATURE,
      time: hourWeather.TIME_UTC
    };
  });

  return { location, weather };

  sleep(2000);
});

console.log(JSON.stringify(locationsWeather));
