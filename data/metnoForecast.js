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
          // lat=${Math.floor(cityCoord.lat * 1000) / 1000}
          // &lon=${Math.floor(cityCoord.lng * 1000) / 1000}
          // &msl=${cityCoord.alt}`;
          const fetchedData = await axios.get(url);
          if (fetchedData.statusText !== 'OK') {
            console.error(
              `Error: ${fetchedData.status} - ${fetchedData.statusText} 
              fetching forecast for city(${i + index}) lng:${cityCoord.lng}, 
              lat: ${cityCoord.lat} alt: ${cityCoord.alt}`
            );
            return undefined;
          }
          const parsedData = await parseStringPromisify(fetchedData.data, (err, result) => {
            if (err) {
              console.error(err);
            }
            console.log(result);
            return result;
          });
          console.log(parsedData);
          // console.log(i);
          return parsedData;
        })
      );
      // structuring the result in the favored output format
      const results = forecastResults.map(forecast => {
        console.log(forecast.weatherdata.product[0].time[0]);
        // return {
        //   location: {
        //     timeStamp: forecast[0].approvedTime || undefined,
        //     lng: forecast[0].geometry.coordinates[0][0],
        //     lat: forecast[0].geometry.coordinates[0][1],
        //     cityName: forecast[1].geonames[0].toponymName,
        //     countryName: forecast[1].geonames[0].countryName
        //   },
        //   weather: forecast[0].timeSeries.map(
        //     result => {
        //       return {
        //         time: result.validTime || undefined,
        //         tempC: extractParameter(result, "t"),
        //         pressureHPA: extractParameter(result, "msl"),
        //         humidityPercent: extractParameter(result, "r"),
        //         windDirectionDeg: extractParameter(result, "wd"),
        //         windSpeedMps: extractParameter(result, "ws"),
        //         cloudinessPercent: extractParameter(result, "tcc_mean"),
        //         lowCloudsPercent: extractParameter(result, "lcc_mean"),
        //         mediumCloudsPercent: extractParameter(result, "mcc_mean"),
        //         highCloudsPercent: extractParameter(result, "hcc_mean"),
        //         weatherCategory: extractParameter(result, "pcat")
        //       };
        //     }
        //   )
        // };
      });
      //saving the structured results into the earlier created file
      // console.log(results);
      // saveResults(PATH, forecastResults, `${i} to ${i + chunkSize - 1}`);
    }
  } catch (error) {
    console.error(error);
  }
};

/** this is a description of errorHandler function
 * @param response {object} fetched data
 * @param dataName {string} the name of fetched data to keep track of the fetch process
 * @param number {number} index that keeps track of the fetched data
 */
// const errorHandler = (response, dataName, number) => {
//   if (response.status !== 200) {
//     throw new Error(
//       `Error: ${response.status} - ${response.statusText} fetching ${dataName}`
//     );
//   }
//   console.log(`Success ${dataName} ${number}`);
// };

/**this is a description of extractPrameter function
 * @param result {object}
 * @param param {string} the parameter in the response provided from the api
 */
const extractParameter = (result, param) => {
  if (result.parameters.length > 0) {
    for (let i = 0; i < result.parameters.length; i++) {
      if (result.parameters[i].name === param) {
        if (param === "pcat") {
          switch (result.parameters[i].values[0]) {
            case 0:
              result.parameters[i].values[0] = "No precipitation";
              break;
            case 1:
              result.parameters[i].values[0] = "Snow";
              break;
            case 2:
              result.parameters[i].values[0] = "Snow and rain";
              break;
            case 3:
              result.parameters[i].values[0] = "Rain";
              break;
            case 4:
              result.parameters[i].values[0] = "Drizzle";
              break;
            case 5:
              result.parameters[i].values[0] = "Freezing rain";
              break;
            case 6:
              result.parameters[i].values[0] = "Freezing drizzle";
              break;
          }
        } else if (
          param === "tcc_mean" ||
          param === "lcc_mean" ||
          param === "mcc_mean" ||
          param === "hcc_mean"
        ) {
          //converting octas to percentage
          result.parameters[i].values[0] =
            result.parameters[i].values[0] * 12.5;
        }
        return result.parameters[i].values[0];
      }
    }
  }
  return undefined;
};

function saveResults(path, results, message) {
  //creating an empty file to save data in
  const data = fs.readFileSync(path, "utf8");
  const json = JSON.parse(data);
  // const citiesData = fs.readFileSync('citiesList.json', 'utf8');
  // const citiesList = JSON.parse(citiesData);
  // const countriesData = fs.readFileSync('countriesList.json', 'utf8');
  // const countriesList = JSON.parse(countriesData);
  results.forEach(result => {
    // if (result.location.countryName !== undefined) {
      // citiesList.push(result.location.cityName);
      // countriesList.push(result.location.countryName);
      json.push(result);
    // }
  });
  fs.writeFileSync(path, JSON.stringify(json, null, 2));
  console.log(`The file ${path} has been saved ${message}!`);
  // fs.writeFileSync('citiesList.json', JSON.stringify(citiesList, null, 2));
  // fs.writeFileSync('countriesList.json', JSON.stringify(countriesList, null, 2));
}
// const sixDigitNumber = (number) => {
//   if ((Math.floor(Math.log(number) / Math.LN10 + 1)) < 6) {
//     let stringedNum = number.toString();
//     if (stringedNum.indexOf(".") == -1) stringedNum += ".";
//     while (stringedNum.length < stringedNum.indexOf(".") + 5) stringedNum += "0";
//     return stringedNum;
//   }
// }

getWeatherData(5, 2);
