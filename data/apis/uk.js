const curl = require("curl");
const fs = require("fs");
// const config = require("../config");
const sleep = require("system-sleep");
// const geohash = require("ngeohash");
const Windrose = require("windrose");

const config = {};
config.metOfficeUK_key = '9faed075-1026-4785-83d4-3a6ccd5e4306';
config.metOfficeUK_chunk = 9;

const UK_LOCATIONS_API = `http://datapoint.metoffice.gov.uk/public/data/val/wxfcs/all/json/sitelist?&key=${config.metOfficeUK_key}`;
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

ChooseUVDescription = UV_code => {
  let UV_description;

  if (UV_code === 1 || UV_code === 2) {
    UV_description =
      "Low exposure.No protection required.You can safely stay outside";
  } else if (3 <= UV_code <= 5) {
    UV_description =
      "Moderate exposure.Seek shade during midday hours, cover up and wear sunscreen";
  } else if (UV_code === 6 || UV_code === 7) {
    UV_description =
      "High exposure. Seek shade during midday hours, cover up and wear sunscreen";
  } else if (8 <= UV_code <= 10) {
    UV_description =
      "Very high. Avoid being outside during midday hours. Shirt, sunscreen and hat are essential";
  } else if (UV_code >= 11) {
    UV_description =
      "Extreme. Avoid being outside during midday hours. Shirt, sunscreen and hat essential.";
  }
  return UV_description;
};

const visibility_acronyms = {
  EX: "Excellent(more than 40km)",
  VG: "Very Good(20- 40km)",
  GO: "Good(10 - 20km)",
  MO: "Moderate(4 - 10km)",
  PO: "Poor(1 - 4km)",
  VP: "Very Poor(less than 1 km)",
  UN: "Unknown"
};

writeFile = (path, data) => {
  fs.writeFileSync(path, JSON.stringify(data, null, 2), err => {
    if (err) throw err;
  });
};

curl.getJSON(UK_LOCATIONS_API, null, (err, response, data) => {
  console.error(
    `Line 89: Requesting all UK locations data. Request statusCode ->${
    response.statusCode
    }`
  );
  if (response.statusCode === 200) {
    data.Locations.Location.sort((a, b) => b.latitude - a.latitude);
    for (let i = 0; i < data.Locations.Location.length; i += config.metOfficeUK_chunk) {
      console.error("Line 105: Requesting weather data based on locations' id");
      requestWeatherData(data.Locations.Location[i].id);
    }

    console.log(JSON.stringify(fullWeatherDetails, null, 2));
  } else if (err) {
    console.error(err);
  }
});

requestWeatherData = locations_id => {
  const WEATHER_REQUEST_URL = `http://datapoint.metoffice.gov.uk/public/data/val/wxfcs/all/json/${locations_id}?res=3hourly&key=${
    config.metOfficeUK_key
    }`;
  curl.getJSON(WEATHER_REQUEST_URL, null, (err, response, data) => {
    console.error(
      `Line 107:Weather data request statusCode ->${response.statusCode}`
    );
    if (response.statusCode === 200) {
      handleWeatherData(data);
    } else if (err) {
      console.error(err);
    }
  });
  sleep(1000);
};

handleWeatherData = data => {
  //const locationName = data.SiteRep.DV.Location.name;
  //const country = data.SiteRep.DV.Location.country;
  //const continent = data.SiteRep.DV.Location.continent;
  const lng = parseFloat(data.SiteRep.DV.Location.lon);
  const lat = parseFloat(data.SiteRep.DV.Location.lat);
  //const elevation = parseFloat(data.SiteRep.DV.Location.elevation);
  //const geohash3 = geohash.encode(lng, lat, (precision = 3));
  //const geohash5 = geohash.encode(lng, lat, (precision = 5));

  const weatherArray = [];

  data.SiteRep.DV.Location.Period.forEach(period => {
    return period.Rep.forEach(weather => {
      let fromHour = Date.parse(`${period.value}${weather.$ / 60}:00`) / 1000;
      let toHour = Date.parse(`${period.value}${weather.$ / 60 + 3}:00`) / 1000;

      const obj = {
        //sourceApi: "metoffice",
        //geohash3,
        //geohash5,
        fromHour,
        toHour,
        temperatureC: parseFloat(weather.T),
        //feelsLikeC: parseFloat(weather.F),
        symbol: weather_type_code_description[weather.W],
        //UV_index: parseInt(weather.U),
        //visibility: visibility_acronyms[weather.V],
        humidityPercent: parseFloat(weather.H),
        windSpeedMps: parseFloat((parseFloat(weather.S) * 0.44704).toFixed(2)),
        windGustMps: parseFloat((parseFloat(weather.G) * 0.44704).toFixed(2)),
        windDirectionDeg: Windrose.getDegrees(weather.D).value,
        //precipitation_probabilityPercent: parseInt(weather.Pp)
      };

      weatherArray.push(obj);
    });
  });
  fullWeatherDetails.push({
    location: {
      //locationName,
      //country,
      //continent,
      lng,
      lat,
      //elevation
    },
    weather: weatherArray
  });
  // console.error(fullWeatherDetails);
  // writeFile("UK-weatherOutput.json", fullWeatherDetails);

  console.error(
    "Line 170: Saved Weather output in 'UK-weatherOutput.json' file. "
  );
};