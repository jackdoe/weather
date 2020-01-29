"use strict";
const axios = require("axios");
const sleep = require("sleep");
const moment = require("moment");
const fs = require("fs");
const japanCities = require("./japan-cities");

let fiveCityNames = japanCities.filter((obj, i) => i < 5 && obj.city); // sample test

(function main() {
  let success = 0;
  let japanWeather = [];
  let errors = 0;
  let rejectedCities = [];

  japanCities.map(async entity => {
//   fiveCityNames.map(async entity => {
    const city = entity.city;
    const url = "https://api.openweathermap.org";
    const token = "600576fe99a5d3a29804568961f1a8ee";

    const weatherAPI = `${url}/data/2.5/weather?q=${city},jp&units=metric&appid=${token}`;

    try {
      const response = await axios.get(weatherAPI);
      const data = response.data;

      const weatherData = structureWeatherData(data);
      const temp = weatherData[0].weather[0].tempratureC;
      console.log(`Temprature now in ${city} is ${temp}`);

      storeWeatherData("japan-weather-data.json", japanWeather, weatherData[0]);

      success++;
      console.log(`✓ Success, city: ${city}`);
      console.log(`Total fulfilled: ${success}\n`);
    } catch (e) {
      rejectedCities.push({ city, reason: e.response.data.message });
      errors++;

      console.log(`❌  Message: ${e.response.data.message}, city name: ${city}`);
      console.log(`Total rejected: ${errors}\n`);
    }

    sleep.sleep(2);

    if (success + errors === japanCities.length) {
//     if (success + errors === fiveCityNames.length) {
      if (!errors) {
        console.log("Done");
        return;
      }
      console.log(`⚠️ Errors in ${JSON.stringify(rejectedCities, null, 2)}`);
      console.log(`Total errors: ${errors} out of ${errors + success}`);
    }
  });
})();

function structureWeatherData(apiData) {
  return [
    {
      location: {
        lat: apiData.coord.lat,
        lng: apiData.coord.lon
      },
      weather: [
        {
          currentTime: moment().format("MMMM Do YYYY, h:mm:ss a"),
          cityName: apiData.name,
          tempratureC: Number(apiData.main.temp.toFixed(0)),
          temp_minC: apiData.main.temp_min,
          temp_maxC: apiData.main.temp_max,
          humidityPercent: apiData.main.humidity,
          pressureHPA: apiData.main.pressure,
          weatherDescription: apiData.weather[0].description,
          cloudsPercent: apiData.clouds.all,
          windSpeedMPS: apiData.wind.speed
        }
      ]
    }
  ];
}

function storeWeatherData(file, data, element) {
  data.push(element);
  fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf8");
}
