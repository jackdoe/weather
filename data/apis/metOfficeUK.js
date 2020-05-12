const curl = require("curl");
const fs = require("fs");
const config = require("./config/config");
const sleep = require("system-sleep");
// const geohash = require("ngeohash");
const Windrose = require("windrose");
const UK_LOCATIONS_API = `http://datapoint.metoffice.gov.uk/public/data/val/wxfcs/all/json/sitelist?&key=${config.metOfficeUK_key}`;
const UK_LastUpdated_URL = `http://datapoint.metoffice.gov.uk/public/data/val/wxfcs/all/json/capabilities?res=3hourly&key=${config.metOfficeUK_key}`;
const fullWeatherDetails = [];

/*The weather API describes the  weather, UV and visibility through codes only.
The meaning of codes could be found on their main page , that is why
I created these 2 objects and function to shows the meaning of those codes and  use it to describe weather in more details
*/

const weather_type_code_description = {
  NA: "Not available",
  0: "Clear night",
  1: "Sunny day",
  2: "Partly cloudy(night)",
  3: "Partly cloudy(day)",
  4: "Not used",
  5: "Mist",
  6: "Fog",
  7: "Cloudy",
  8: "Overcast",
  9: "Light rain shower(night)",
  10: "Light rain shower(day)",
  11: "Drizzle",
  12: "Light rain",
  13: "Heavy rain shower(night)",
  14: "Heavy rain shower(day)",
  15: "Heavy rain",
  16: "Sleet shower(night)",
  17: "Sleet shower(day)",
  18: "Sleet",
  19: "Hail shower(night)",
  20: "Hail shower(day)",
  21: "Hail",
  22: "Light snow shower(night)",
  23: "Light snow shower(day)",
  24: "Light snow",
  25: "Heavy snow shower(night)",
  26: "Heavy snow shower(day)",
  27: "Heavy snow",
  28: "Thunder shower(night)",
  29: "Thunder shower(day)",
  30: "Thunder"
};


writeFile = (path, data) => {
  fs.writeFileSync(path, JSON.stringify(data, null, 2), err => {
    if (err) throw err;
  });
};



requestWeatherData = (locations_id, update) => {
  const WEATHER_REQUEST_URL = `http://datapoint.metoffice.gov.uk/public/data/val/wxfcs/all/json/${locations_id}?res=3hourly&key=${
    config.metOfficeUK_key
    }`;
  curl.getJSON(WEATHER_REQUEST_URL, null, (err, response, data) => {
    console.error(`Line 100:Weather data request statusCode ->${response.statusCode}`);
    if (response.statusCode === 200) {
      handleWeatherData(data, update);
    } else if (err) {
      console.error(err);
    }
  });
  sleep(1000);
};

handleWeatherData = (data, update) => {
  const lng = parseFloat(data.SiteRep.DV.Location.lon);
  const lat = parseFloat(data.SiteRep.DV.Location.lat);
  const alt = parseFloat(data.SiteRep.DV.Location.elevation);
  const updatedTimestamp = Date.parse(update.Resource.dataDate) / 1000;

  const weatherArray = [];

  data.SiteRep.DV.Location.Period.forEach(period => {
    return period.Rep.forEach(weather => {
      let fromHour = Date.parse(`${period.value}${weather.$ / 60}:00`) / 1000;
      let toHour = Date.parse(`${period.value}${weather.$ / 60 + 3}:00`) / 1000;

      const obj = {
        fromHour,
        toHour,
        updatedTimestamp,
        temperatureC: parseFloat(weather.T),
        // feelsLikeC: parseFloat(weather.F),
        symbol: weather_type_code_description[weather.W],
        humidityPercent: parseFloat(weather.H),
        windSpeedMps: parseFloat((parseFloat(weather.S) * 0.44704).toFixed(2)),
        windGustMps: parseFloat((parseFloat(weather.G) * 0.44704).toFixed(2)),
        windDirectionDeg: Windrose.getDegrees(weather.D).value,
      };

      weatherArray.push(obj);
    });
  });
  fullWeatherDetails.push({
    location: {
      lng,
      lat,
      alt
    },
    weather: weatherArray
  });
};

curl.getJSON(UK_LastUpdated_URL, null, (err, response, update) => {
  if (err) {
    throw (err);
  }
  console.error(`Line 159:Weather data last update request statusCode ->${response.statusCode}`);

  curl.getJSON(UK_LOCATIONS_API, null, (err, response, data) => {
    console.error(`Line 165: Requesting all UK locations data. Request statusCode ->${response.statusCode}`
    );

    if (response.statusCode === 200) {
      data.Locations.Location.sort((a, b) => b.latitude - a.latitude);
      for (let i = 0; i < data.Locations.Location.length; i += config.metOfficeUK_chunk) {
        requestWeatherData(data.Locations.Location[i].id, update);
        console.error("Line 172: Requesting weather data based on locations' id");
      }

    } else if (err) {
      console.error(err);
    }
    console.log(JSON.stringify(fullWeatherDetails, null, 2));
    console.error("Line 179: Saved Weather output in 'UK-weatherOutput.json' file.");
  });
});