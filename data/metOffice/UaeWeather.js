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

  const weatherDaily = locWeatherJson.DAILY_FORECAST.map(dayWeather => {
    return {
      time: dayWeather.TIME_UTC,
      tempC: dayWeather.TEMPERATURE_AVG,
      tempMax: dayWeather.TEMPERATURE_MAX,
      tempMin: dayWeather.TEMPERATURE_MIN,
      tempFeel: dayWeather.TEMPERATURE_FEELSLIKE,
      windSpeed: dayWeather.WIND_SPEED,
    };
  });

  const weatherHourly = locWeatherJson.HOURLY_FORECAST.map(hourWeather => {
    return {
      localTime: hourWeather.TIME_TIME,
      tempC: hourWeather.TEMPERATURE,
      tempFeel: hourWeather.TEMPERATURE_FEELSLIKE,
      pressure: hourWeather.PRESSURE,
      humidity: hourWeather.HUMIDITY,
      windSpeed: hourWeather.WIND_SPEED,
      lowCloud: hourWeather.LOW_CLOUD,
      medCloud: hourWeather.MED_CLOUD,
      highCloud: hourWeather.HIGH_CLOUD,
      precipitation: hourWeather.TOTAL_PRECIPITATION,
      dewPointTemp: hourWeather.DEWPOINT_TEMPERATURE
    };
  });

  return { location, weatherDaily, weatherHourly };

  sleep(2000);
});

console.log(JSON.stringify(locationsWeather));
