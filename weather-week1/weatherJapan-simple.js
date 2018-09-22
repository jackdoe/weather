"use strict";
const axios = require("axios");
const sleep = require("sleep");
const moment = require("moment");
const fs = require("fs");
const japanCities = require("./japan-cities");

let fiveCityNames = japanCities.filter((obj, i) => i < 5 && obj.city); // sample test

(function main() {

  japanCities.map(async entity => {
//   fiveCityNames.map(async entity => {
    let japanWeather = [];
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
    } catch (e) {
      console.log(`❌  Message: ${e.response.data.message}, city name: ${city}`);
    }

    sleep.sleep(2);

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
