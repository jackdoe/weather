'use strict'

const cheerio = require('cheerio');
const axios = require('axios');
const { readJSONFile, writeJSONFile } = require('./fileOperations');

const DUTCH_URL = 'https://www.knmi.nl/nederland-nu/weer/waarnemingen';
const CITIES_LOCATION_FILE = './netherlandsCities.json';
const CITIES_WEATHER_FILE = './netherlandsWeather.json'

async function main() {
  try {

    const dutchCities = await readJSONFile(CITIES_LOCATION_FILE);
    const response = await axios.get(DUTCH_URL)
    const cheerioObject = cheerio.load(response.data);

    const stationsData = cheerioObject('tbody > tr')
      .toArray()
      .map(row => row.children
        // Select only the cells
        .filter(cell => cell.name === 'td' && cell.type === 'tag')
        // Get only the content of each cell
        .map(td => td.children[0] && td.children[0].data)
      );

    const dutchWeather = stationsData.map(station => {
      const cityLocation = dutchCities.find(elem => elem.name === station[0]);
      return {
        location:
        {
          lat: cityLocation.lat,
          lng: cityLocation.lng
        }
      };
    });

    dutchWeather.forEach((city, index) => {
      city.weather = [{
        timeStamp: new Date().getTime(),
        condition: stationsData[index][1],
        tempC: stationsData[index][2],
        humidityPercent: stationsData[index][3],
        windSpeedMps: stationsData[index][5],
        visibilityM: stationsData[index][6],
        pressureHPA: stationsData[index][7]
      }];
    });

    await writeJSONFile(CITIES_WEATHER_FILE, dutchWeather);
    console.log(JSON.stringify(dutchWeather, null, 2));
    return;

  } catch (error) {
    console.log(error);
  }
}

main();