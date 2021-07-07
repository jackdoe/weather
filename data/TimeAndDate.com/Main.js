const curl = require("curl");
const jsdom = require("jsdom");
const fs = require("fs");
const { JSDOM } = jsdom;
const sleep = require("system-sleep");

const url = "https://www.latlong.net/category/cities-182-15.html";

writeFile = (path, data) => {
  fs.writeFile(path, JSON.stringify(data, null, 2), err => {
    if (err) throw err;
  });
};

//requesting cities of Russia included longitude and latitude
curl.get(url, null, (err, resp, body) => {
  console.log(`Requesting cities of Russia.StatusCode-> ${resp.statusCode}.`);
  if (resp.statusCode === 200) {
    parseData(body);
  } else if (err) {
    console.log("Error while fetching");
  }
});

const locationAndWeather = [];
const RussianCities = [];
const long_lat_cityName = [];

parseData = html => {
  const dom = new JSDOM(html);
  const $ = require("jquery")(dom.window);
  const items = $("tr");
  for (let i = 1; i < items.length; i++) {
    const td = $(items[i]).find("td");
    const cityName = $($(td).find("a"))
      .text()
      .replace(/,/g, "")
      .split(" ")[0];
    const longitude = $($(td)[1]).html();
    const latitude = $($(td)[2]).html();
    
    const long_lat_city_obj = {
      cityName,
      longitude,
      latitude
    };

    long_lat_cityName.push(long_lat_city_obj);
    writeFile("RussianCities.json", long_lat_cityName);

    //requesting weather information of each city
    curl.get(
      `https://www.timeanddate.com/weather/russia/${cityName}`,
      (err, resp, body) => {
        console.log(`Requesting weather data for ${cityName}.`);

        if (resp.statusCode === 404) {
          console.log(
            `No data was found for ${cityName}.Searching for the next one.StatusCode ${
              resp.statusCode
            }.`
          );
        }

        if (resp.statusCode === 200 && resp.statusCode !== 404) {
          console.log(
            `Found data for ${cityName}.StatusCode ${resp.statusCode}`
          );
          const dom = new JSDOM(body);
          const $ = require("jquery")(dom.window);
          const divItems = $("#qlook").children();
          const temperatureData = $($(divItems)[2])
            .html()
            .replace(/&nbsp;/g, "");
          const temperature = parseInt(temperatureData);
          const description = $($(divItems)[3]).html();
          const details = $("#qfacts").children();
          const pressureData = $($(details)[5])
            .text()
            .split(" ")[2];
          const pressure = parseInt(pressureData);
          const humidityData = $($(details)[6])
            .text()
            .split(" ")[2];
          const humidity = parseInt(humidityData);
          const tempDetails = $($(divItems)[5])
            .text()
            .split(" ");
          const feelsLikeData = $($(tempDetails))[2].slice(0, 2);
          const feelsLike = parseInt(feelsLikeData);
          const windData = $($(tempDetails))[6];
          const wind = parseInt(windData);
          //Full data object
          const obj = {
            location: {
              City: cityName,
              Longitude: longitude,
              Latitude: latitude
            },
            weather: [
              {
                city: cityName,
                dateTime: new Date().toLocaleString(),
                temperatureC: temperature,
                feelsLikeC: feelsLike,
                description,
                pressureMBAR: pressure,
                humidityPercent: humidity,
                windKmh: wind
              }
            ]
          };
          locationAndWeather.push(obj);
          RussianCities.push(cityName);
          //console.log(JSON.stringify(locationAndWeather, null, 2));

          //saving full information in JSON file
          writeFile("Weather-Output.json", locationAndWeather);
          //saving Russian cities in JSON file
          writeFile("This-cities-have-weather-information.json", RussianCities);
        } else if (err) {
          console.log("Error while fetching");
        }
      }
    );
    sleep(2000);
  }
};
