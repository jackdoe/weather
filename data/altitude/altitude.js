'use strict';

const axios = require('axios');
const sleep = require('sleep');
const { readCities, writeCities } = require('./fileOperations');
const config = require('./config');

const CITIES_FILE_PATH = './top-1000-cities.json';
const API_URL = 'https://elevation-api.io/api/elevation?points=';
const CITY_PER_REQUEST = config.cityPerRequest;

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

    console.log(error);

  }

}

async function getAlt(cities) {

  const valuesString = cities.reduce((str, city) =>
    str + '(' + city.lat + ',' + city.lng + '),', '').slice(0, -1);
  const response = await axios.get(API_URL + valuesString);
  return response.data.elevations.map(city => city.elevation);

}