const apiOutput = require("./requestOutputs/weatherOutputAPI.json");
const metnoOutput = require("./requestOutputs/weatherOutputMetno.json");
const date = Math.round(new Date().getTime() / 1000);
const fs = require("fs");

writeFile = (path, data) => {
  fs.writeFile(path, JSON.stringify(data, null, 2), err => {
    if (err) throw err;
  });
};

// sum of current day temperature MetnoData
const metNoTempC = metnoOutput.map(data => data.weather[0].temperatureC);

//sum of current day temperature API data
const tempAPIData = apiOutput.map(data => data.weather[0].temperatureC);

const windAPIData = apiOutput.map(data => data.weather[0].windSpeedMps);

const pressureAPIData = apiOutput.map(data => data.weather[0].pressureHPA);
const forecastDate = metnoOutput[0].weather[0].fromHour;

const reducer = (accumulator, currentValue) => accumulator + currentValue;

const sumOfTemp = parseInt(tempAPIData.reduce(reducer));
const sumOfWind = parseInt(windAPIData.reduce(reducer));
const sumOfPressure = parseInt(pressureAPIData.reduce(reducer));
const sumOfMetNoTemp = parseInt(metNoTempC.reduce(reducer));
const temperatureDifference = sumOfMetNoTemp - sumOfTemp;
const numberOfForecast = apiOutput[1].weather.length;

const stats = {
  timeStampRun: date,
  forecastDate,
  weatherApi: "developer.weatherunlocked.com",
  metNoAPI: "https://api.met.no",
  countOfCities: apiOutput.length,
  countOfItems: apiOutput.length * numberOfForecast,
  sumOfTemp,
  sumOfWind,
  sumOfPressure,
  temperatureDifference
};
writeFile(`./stats-folder/stats-${date}.json`, stats);

console.log(stats);
