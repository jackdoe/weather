"use strict";
/** This is a description of the @async getWeatherData function
 * the api provides forecast information for 1665 cities in
 * Sweden Finland Norway Estonia Latvia Lithuania Denmark north of Germany Poland The Netherlands
 * Belarus and Russia
 * this number can be more depending on @var downsample this variable allows an integer between 0-20.
 * A downsample value of 2 means that every other value horizontally and vertically is displayed.
 * @param url the url of api for fetching the forecast data
 * @param chunkSize {number} of coordinates to be used in one fetch request
 * @param pausing  {number} of seconds the application will take before making another fetch request
 * if value is not available undefined value is provided as value
 */
const parseString = require("xml2js").parseString;
const util = require('util');
const axios = require("axios");
const sleep = require("sleep");
const fs = require("fs");
const moment = require("moment");
const PATH = `${moment().format("YYYYMMDD")}_topCities.json`;
// const top1000CitiesURL =
//   "https://raw.githubusercontent.com/Meazer/weather/altitude/data/altitude/top-1000-cities.json";
const baseURL = "https://api.met.no/weatherapi/locationforecast/1.9/?"; //setting base url with all static parameters
const parseStringPromisify = util.promisify(parseString);
//creating new empty file dated per day
fs.writeFile(PATH, JSON.stringify([]), err => {
  if (err) throw err;
  // console.log(`The ${PATH} has been created!`);
});

const getWeatherData = async (chunkSize, pausing) => {
  try {
    //fetching cities coordinates from the api
    const coordinatesCities = JSON.parse(fs.readFileSync('top1000Cities.json', 'utf8'));
    
    // console.log(`fetched ${coordinatesCities.length} cities`);

    //for loop to make fetch in chunks that can be assigend with passing chunkSize to the getWeatherData function
    for (let i = 0; i < coordinatesCities.length; i += chunkSize) {
      // console.log(`fetching from ${i} to ${i + chunkSize}`);
      const slicedCoordinates = coordinatesCities.slice(i, i + chunkSize - 1); //slicing newCities array to a chunckSize array

      //fetching forecast data and city name for the slicedCoordinates array
      const forecastResults = await Promise.all(
        slicedCoordinates.map(async (cityCoord, index) => {
          // console.log(`fetching city: ${cityCoord.name}`);
          // pausing before making each fetch
          sleep.sleep(pausing);
          const url = `https://api.met.no/weatherapi/locationforecastlts/1.3/?lat=${cityCoord.lat}&lon=${cityCoord.lng}&msl=${cityCoord.alt}`;
          const fetchedData = await axios.get(url);
          if (fetchedData.statusText !== 'OK') {
            console.error(
              `Error: ${fetchedData.status} - ${fetchedData.statusText} 
              fetching forecast for city(${i + index}) lng:${cityCoord.lng}, 
              lat: ${cityCoord.lat} alt: ${cityCoord.alt}`
            );
            return;
          }
          const parsedData = await parseStringPromisify(fetchedData.data);
          return parsedData;
        })
      );
      // structuring the result in the favored output format
      const results = forecastResults.map((forecast, index) => {

        return {
          location: {
            timeStamp: forecast.weatherdata.$.created || undefined,
            lng: Math.ceil(slicedCoordinates[index].lng * 10000)/10000,
            lat: Math.ceil(slicedCoordinates[index].lat * 10000) / 10000,
          },
          weather: forecast.weatherdata.product[0].time.map(result => {
            return {
              time: result.$.from || null,
              lng: result.location[0].$.longitude,
              lat: result.location[0].$.latitude,
              altitude: result.location[0].$.altitude,
              tempC: result.location[0].temperature ? result.location[0].temperature[0].$.value : null,
              pressureHPA: result.location[0].pressure ? result.location[0].pressure[0].$.value : null,
              humidityPercent: result.location[0].humidity ? result.location[0].humidity[0].$.percent : null,
              windDirectionDeg: result.location[0].windDirection ? result.location[0].windDirection[0].$.deg : null,
              windSpeedMps: result.location[0].windSpeed ? result.location[0].windSpeed[0].$.mps : null,
              cloudinessPercent: result.location[0].cloudiness ? result.location[0].cloudiness[0].$.percent : null,
              fogPercent: result.location[0].fog ? result.location[0].fog[0].$.percent : null,
              lowCloudsPercent: result.location[0].lowClouds ? result.location[0].lowClouds[0].$.percent : null,
              mediumCloudsPercent: result.location[0].mediumClouds ? result.location[0].mediumClouds[0].$.percent : null,
              highCloudsPercent: result.location[0].highClouds ? result.location[0].highClouds[0].$.percent : null,
              dewpointTemperature: result.location[0].dewpointTemperature ? result.location[0].dewpointTemperature[0].$.value : null,
              precipitationMm: result.location[0].precipitation ? result.location[0].precipitation[0].$.value : null,
              weatherCategory: result.location[0].symbol ? result.location[0].symbol[0].$.id : null
              };
            }
          )
        };
      });
      // saving the structured results into the earlier created file
      saveResults(PATH, results, `${i} to ${i + chunkSize - 1}`);
    }
  } catch (error) {
    console.error(error);
  }
};

/**this is a description of extractPrameter function
 * @param path {string} the path where data will be saved
 * @param results {any} the results you want to save
 * @param message {string} [optional] the extra message you want to print in console.error with file has been saved
 */
function saveResults(path, results, message) {
  //creating an empty file to save data in
  const data = fs.readFileSync(path, "utf8");
  const json = JSON.parse(data);

  results.forEach(result => {
    json.push(result);
  });
  fs.writeFileSync(path, JSON.stringify(json, null, 2));
  console.log(`The file ${path} has been saved ${message || null}!`);
}


getWeatherData(5, 2);
