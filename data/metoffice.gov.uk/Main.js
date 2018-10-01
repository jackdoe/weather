const curl = require("curl");
const fs = require("fs");
const requestKey = require("./config.json");
const sleep = require("system-sleep");

const UK_LOCATIONS_API = `http://datapoint.metoffice.gov.uk/public/data/val/wxfcs/all/json/sitelist?&key=${
  requestKey.key
}`;

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
  fs.writeFile(path, JSON.stringify(data, null, 2), err => {
    if (err) throw err;
  });
};

curl.getJSON(UK_LOCATIONS_API, null, (err, response, data) => {
  console.log(
    `Line 87: Requesting all UK locations data. Request statusCode ->${
      response.statusCode
    }`
  );
  if (response.statusCode === 200) {
    const locations = data.Locations.Location.map(location => location.name);
    writeFile("UK-6001-LocationNames.json", locations);
    writeFile("UK-LocationDetails.json", data);
    console.log("Line 105: Requesting weather data based on locations' id");
    data.Locations.Location.map(location => requestWeatherData(location.id));
  } else if (err) {
    console.log(err);
  }
});

requestWeatherData = locations_id => {
  const WEATHER_REQUEST_URL = `http://datapoint.metoffice.gov.uk/public/data/val/wxfcs/all/json/${locations_id}?res=3hourly&key=${
    requestKey.key
  }`;
  curl.getJSON(WEATHER_REQUEST_URL, null, (err, response, data) => {
    console.log(
      `Line 107:Weather data request statusCode ->${response.statusCode}`
    );
    if (response.statusCode === 200) {
      handleWeatherData(data);
    } else if (err) {
      console.log(err);
    }
  });
  sleep(3000);
};

handleWeatherData = data => {
  const locationName = data.SiteRep.DV.Location.name;
  const country = data.SiteRep.DV.Location.country;
  const continent = data.SiteRep.DV.Location.continent;
  const longitude = data.SiteRep.DV.Location.lon;
  const latitude = data.SiteRep.DV.Location.lat;
  const elevation = data.SiteRep.DV.Location.elevation;

  const weatherArray = data.SiteRep.DV.Location.Period.map(period => {
    const day = period.value;
    const detailsObj = {
      day,
      weather_details: []
    };

    period.Rep.filter(weather => {
      const obj = {
        temperatureC: parseInt(weather.T),
        feelsLikeC: parseInt(weather.F),
        weather_description: weather_type_code_description[weather.W],
        UV_index: ChooseUVDescription(weather.U),
        visibility: visibility_acronyms[weather.V],
        humidityPercent: parseInt(weather.H),
        windSpeedMph: parseInt(weather.S),
        windGustMph: parseInt(weather.G),
        windDirectionCompass: weather.D,
        precipitation_probabilityPercent: parseInt(weather.Pp)
      };
      detailsObj.weather_details.push(obj);
    });
    return detailsObj;
  });

  const fullWeatherDetails = [
    {
      licence:
        "Contains public sector information licensed under the Open Government Licence",
      data_information: " Three-hourly five-day forecast",

      location: {
        locationName,
        country,
        continent,
        longitude,
        latitude,
        elevation
      },
      weather: weatherArray
    }
  ];
  //console.log(JSON.stringify(fullWeatherDetails, null, 2));
  writeFile("UK-weatherOutput.json", fullWeatherDetails);
  console.log(
    "Line 170: Saved an example of Weather output in 'UK-weatherOutput.json' file. "
  );
};
