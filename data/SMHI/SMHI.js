/** This is a description of the @async getWeatherData function
 * the api provides forecast information for 1665 cities in 
 * Sweden Finland Norway Estonia Latvia Lithuania Denmark north of Germany Poland The Netherlands
 * Belarus and Russia
 * this number can be more depending on @var downsample this variable allows an integer between 0-20. 
 * A downsample value of 2 means that every other value horizontally and vertically is displayed.
 * @param url the url of api for fetching the forecast data 
 * @param chunkSize {number} of coordinates to be used in one fetch request
 * @param pausing  {number} of seconds the application will take before making another fetch request
 * if value is not available "undefined" {string} is provided as value
*/
// import username from "myConfig";
const fetch = require("node-fetch");
const sleep = require("sleep");
const geolib = require("geolib");
const fs = require("fs");
const moment = require("moment");
const PATH = `${moment().format("YYYYMMDD")}sweden_results.json`;
const baseURL = "https://opendata-download-metfcst.smhi.se/api/category/pmp3g/version/2"; //setting base url with all static parameters
const downsample = 17; 
const coordinatesURL = `${baseURL}/geotype/multipoint.json?downsample=${downsample}`; //getting coordinates from the api
const polygonURL = `${baseURL}/geotype/polygon.json`;
const username = "freeweatherapi";
const cityNameURL = "http://api.geonames.org/findNearbyPlaceNameJSON?";

//creating new empty file dated per day
fs.writeFile(PATH, JSON.stringify([]), (err) => {
  if (err) throw err;
  console.log(`The ${PATH} has been created!`);
});

const getWeatherData = async (url, chunkSize, pausing) => {
  try {
    // fetching polygon coordinates from the api (for future reliability in case coordinates changes);
    const responsePolygon = await fetch(polygonURL);
    errorHandler(responsePolygon, "responsePolygon", 1);
    const parsedPolygon = await responsePolygon.json();

    //structuring polygonBoundaries
    const polygonBoundaries = parsedPolygon.coordinates.map(coordinates => {
      return { latitude: coordinates[1], longitude: coordinates[0] };
    });
    //fetching cities coordinates from the api
    const responseCoordinates = await fetch(url);
    errorHandler(responseCoordinates, "responseCoordinates", 1);
    const coordinatesCities = await responseCoordinates.json();
    console.log(`fetching ${coordinatesCities.coordinates.length} cities`);
    
    //filtering coordinates that are inside the polygon
    const testedInBoundaries = coordinatesCities.coordinates.filter(city => {
      return geolib.isPointInside(
        { latitude: city[1], longitude: city[0] },
        polygonBoundaries
      );
    });
    //structuring the tested coordinates
    const SMHICities = await testedInBoundaries.map(city => {
      return {lat: city[1], lng: city[0]};
    });
    //saving coordinates in a separate file
    await fs.writeFile("SMHICities.json", JSON.stringify(SMHICities), err => {
        if (err) throw err;
        console.log("The file has been saved!");
      }
    );

    //for loop to make fetch in chunks that can be assigend with passing chunkSize to the getWeatherData function
    for (let i = 0; i < testedInBoundaries.length; i += chunkSize) {
      console.log(`fetching from ${i} to ${i + chunkSize}`);
      const slicedCoordinates = testedInBoundaries.slice(i, i + chunkSize - 1); //slicing testedInBoundaries array to a chunckSize array

      //fetching forecast data and city name for the slicedCoordinates array
      const forecastResults = await Promise.all(
        slicedCoordinates.map(async (testedCoordinates, index) => {
          // pausing before making each fetch
          sleep.sleep(pausing); 
          const result = await fetch(`${baseURL}/geotype/point/lon/${Math.floor(testedCoordinates[0] * 1000000) / 1000000}/lat/${Math.floor(testedCoordinates[1] * 1000000) / 1000000}/data.json`);
          errorHandler(result, "response forecast result", i + index);
          // fetching city name based on nearest populated place from geoname api
          const fetchCityName = await fetch(
            `${cityNameURL}lat=${Math.floor(testedCoordinates[1] * 1000000) /
              1000000}&lng=${Math.floor(testedCoordinates[0] * 1000000) /
              1000000}&username=${username}`
          );
          errorHandler(fetchCityName, "response cityName", i + index);
          //parsing coordinates and fetched forecast from JSON
          const cityName = await fetchCityName.json();
          const parsedResult = await result.json();
          if (cityName.geonames !== undefined && cityName.geonames.length > 0) {
            return [parsedResult, cityName];
          }
          console.log(`city name not found for lat:${testedCoordinates[1]}, lng ${testedCoordinates[0]}`);
          return [
            parsedResult,
            { geonames: [{ name: "undefined", countryName: "undefined" }] }
          ];
        })
      );
      //structuring the result in the favored output format
      const results = forecastResults.map(forecast => {
        return {
          location: {
            timeStamp: forecast[0].approvedTime,
            lng: forecast[0].geometry.coordinates[0][0],
            lat: forecast[0].geometry.coordinates[0][1],
            cityName: forecast[1].geonames[0].toponymName,
            countryName: forecast[1].geonames[0].countryName
          },
          weather: forecast[0].timeSeries.map(result => {
            return {
              time: result.validTime,
              tempC: extractParameter(result, "t"),
              pressureHPA: extractParameter(result, "msl"),
              humidityPercent: extractParameter(result, "r"),
              windDirectionDeg: extractParameter(result, "wd"),
              windSpeedMps: extractParameter(result, "ws"),
              cloudinessPercent: extractParameter(result, "tcc_mean"),
              lowCloudsPercent: extractParameter(result, "lcc_mean"),
              mediumCloudsPercent: extractParameter(result, "mcc_mean"),
              highCloudsPercent: extractParameter(result, "hcc_mean"),
              weatherCategory: extractParameter(result, "pcat")
            };
          })
        };
      });
      //saving the structured results into the earlier created file
      saveResults(PATH, results, `${i} to ${i + chunkSize - 1}`);
    }
  } catch (error) {
    console.error(error);
  }
}
/** this is a description of errorHandler function
 * @param response {object} fetched data
 * @param dataName {string} the name of fetched data to keep track of the fetch process
 * @param number {number} index that keeps track of the fetched data
 */
const errorHandler = (response, dataName, number) => {
  if (response.status !== 200) {
    throw new Error( `Error: ${response.status} - ${response.statusText} fetching ${dataName}` );
  }
  console.log(`Success ${dataName} ${number}`);
};

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
        }
        else if (param === "tcc_mean" || param === "lcc_mean" || param === "mcc_mean" || param === "hcc_mean") {
          //converting octas to percentage
          result.parameters[i].values[0] = result.parameters[i].values[0]*12.5;
        }
        return result.parameters[i].values[0];
      }
    }
  }
  return "undefined";
};

async function saveResults(path, results, message) {
  //creating an empty file to save data in
  try{
  await fs.readFile(path, "utf8", async (err, data) => {
    try {
      if (err) throw new Error(`Failed to read file ${path}`);
      const json = await JSON.parse(data);
      results.forEach(result => {
        json.push(result);
      });
      await fs.writeFile(path, JSON.stringify(json, null, 2), (err) => {
        if (err)
          throw err;
        console.log(`The file ${path} has been saved ${message}!`);
      });
    } catch (error) {
      console.log(`${error} savingResults`)
    }
  });
  } catch (error) {
    console.log(`${error} savingResults`)
  }
}

getWeatherData(coordinatesURL, 5, 2);
