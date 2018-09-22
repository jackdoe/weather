'use strict';

const { readCities, writeCities } = require('./fileOperations');
const axios = require('axios');
const sleep = require('sleep');

const CITIES_FILE_PATH = '../data/cities.json';
const CITY_PER_REQUEST = 30;
const BING__KEY = 'At-zja7IaoR52gAP-zGz5g9LDRK8BmakJ6quzIKahfAUIZjh8_yeq7dZazdvdTs7';
const BING_API_URL = 'http://dev.virtualearth.net/REST/v1/Elevation/List?points=';
const API_URL = 'https://maps.googleapis.com/maps/api/elevation/json?locations=';
const API_URL2 = 'https://elevation-api.io/api/elevation?points='

main();

async function main() {
  try {

    const cities = await readCities(CITIES_FILE_PATH);
    const startFrom = cities.findIndex(city => !city.hasOwnProperty('alt'));
    if (startFrom === -1)
      return console.log('All cities are already updated');

    console.log('Start updating at index ' + startFrom);

    for (let i = startFrom; i < cities.length; i += CITY_PER_REQUEST) {

      const editingCities = cities.slice(i, i + CITY_PER_REQUEST);
      const altValues = await getAlt(editingCities);

      altValues.forEach((alt, index) => {
        cities[index + i].alt = alt;
      });

      await writeCities(CITIES_FILE_PATH, cities);
      console.log(altValues.length + ' cities have been updated');
      sleep.sleep(2);

    }
  } catch (error) {

    console.log(error.message);

  }

}

async function getAlt(cities) {

  const valuesString = cities.reduce((str, city) =>
    str + city.lat + ',' + city.lng + ',', '').slice(0, -1);
  const response = await axios.get(BING_API_URL + valuesString + '&key=' + BING__KEY);
  if (response.data.statusDescription !== 'OK')
    throw new Error(response.data.errorDetails);
  return response.data.resourceSets[0].resources[0].elevations;

}