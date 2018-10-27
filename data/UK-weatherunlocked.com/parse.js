const axios = require("axios");
const sleep = require("system-sleep");
const fs = require("fs");
const config = require("./config.json");
const requestKey = config.key;
const requestId = config.id;
const geohash = require("ngeohash");

changeDateFormat = date => {
  let r = date.replace(/\//g, " ").split(" ");
  return r[2] + "-" + r[1] + "-" + r[0];
};

let description_codes = {
  0: "Sunny skies/Clear skies",
  1: "	Partly cloudy skies",
  2: "Cloudy skies",
  3: "	Overcast skies",
  10: "Mist",
  21: "Patchy rain possible",
  22: "Patchy snow possible",
  23: "Patchy sleet possible",
  24: "Patchy freezing drizzle possible",
  29: "Thundery outbreaks possible",
  38: "Blowing snow",
  39: "Blizzard",
  45: "Fog",
  49: "Freezing fog",
  50: "Patchy light drizzle",
  51: "Light drizzle",
  56: "Freezing drizzle",
  57: "Heavy freezing drizzle",
  60: "Patchy light rain",
  61: "Light rain",
  62: "Moderate rain at times",
  63: "Moderate rain",
  64: "Heavy rain at times",
  65: "Heavy rain",
  66: "Light freezing rain",
  67: "Moderate or heavy freezing rain",
  68: "Light sleet",
  69: "Moderate or heavy sleet",
  70: "Patchy light snow",
  71: "Light snow",
  72: "Patchy moderate snow",
  73: "Moderate snow",
  74: "Patchy heavy snow",
  75: "Heavy snow",
  79: "Ice pellets",
  80: "Light rain shower",
  81: "Moderate or heavy rain shower",
  82: "Torrential rain shower",
  83: "Light sleet showers",
  84: "Moderate or heavy sleet showers",
  85: "Light snow showers",
  86: "Moderate or heavy snow showers",
  87: "Light showers of ice pellets",
  88: "Moderate or heavy showers of ice pellets",
  91: "Patchy light rain with thunder",
  92: "Moderate or heavy rain with thunder",
  93: "Patchy light snow with thunder",
  94: "Moderate or heavy snow with thunder"
};

let cities = fs.readFileSync("GBcities.json", "utf-8");
let citiesObj = JSON.parse(cities);
let finalWeatherArray = [];
let availableCities = [];
const metNoFinalArray = [];

writeFile = (path, data) => {
  fs.writeFile(path, JSON.stringify(data, null, 2), err => {
    if (err) throw err;
  });
};

for (let city of citiesObj) {
  axios({
    method: "get",
    url: `http://api.weatherunlocked.com/api/forecast/${city.lat},${
      city.lng
    }?app_id=${requestId}&app_key=${requestKey}`,
    responseType: "json"
  })
    .then(response => {
      availableCities.push(city.name);
      writeFile(
        "./requestOutputs/this-cities-have-weatherInformation.json",
        availableCities
      );
      handleWeatherData(response.data, city);
    })
    .catch(err => console.error(err));
  sleep(2000);
}

function handleWeatherData(data, city) {
  const geohash3 = geohash.encode(city.lng, city.lat, (precision = 3));
  const geohash5 = geohash.encode(city.lng, city.lat, (precision = 5));

  const weatherArray = [];

  data.Days.map(weather => {
    weather.Timeframes.map(weatherObj => {
      let date = changeDateFormat(weatherObj.date);
      let time = weatherObj.time / 100;

      let fromHour = Date.parse(`${date} ${time}:00`) / 1000;
      let toHour = Date.parse(`${date} ${time + 3}:00`) / 1000;

      let weatherDetails = {
        date: weatherObj.date,
        sourceApi: " developer.weatherunlocked.com",
        geohash3,
        geohash5,
        fromHour,
        toHour,
        temperatureC: parseFloat(weatherObj.temp_c),
        feelsLikeC: parseFloat(weatherObj.feelslike_c),
        dewpointTemperatureC: parseFloat(weatherObj.dewpoint_c),
        cloudinessPercent: parseFloat(weatherObj.cloudtotal_pct),
        symbol: weatherObj.wx_desc,
        lowCloudsPercent: parseFloat(weatherObj.cloud_low_pct),
        midCloudsPercent: parseFloat(weatherObj.cloud_mid_pct),
        highCloudsPercent: parseFloat(weatherObj.cloud_high_pct),
        visibilityKm: parseFloat(weatherObj.vis_km),
        humidityPercent: parseFloat(weatherObj.humid_pct),
        windSpeedMps: parseFloat(weatherObj.windspd_ms),
        windGustMps: parseFloat(weatherObj.windgst_ms),
        windDirectionDeg: parseFloat(weatherObj.winddir_deg),
        precipitation_probabilityPercent: weatherObj.prob_precip_pct,
        pressureHPA: parseFloat(weatherObj.slp_mb),
        data_information: " 3-hourly 7-day forecast",
        licence: "Based on data from developer.weatherunlocked.com"
      };
      weatherArray.push(weatherDetails);
    });
  });

  let weatherForecast = {
    location: {
      city: city.name,
      longitude: parseFloat(city.lng),
      latitude: parseFloat(city.lat),
      altitude: parseInt(city.altitude)
    },
    weather: weatherArray
  };

  finalWeatherArray.push(weatherForecast);
  writeFile("./requestOutputs/weatherOutputAPI.json", finalWeatherArray);
   console.log(JSON.stringify(finalWeatherArray, null, 2));
}
