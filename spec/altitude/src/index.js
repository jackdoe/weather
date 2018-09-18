'use strict';

const { readCities, writeCities } = require('./fileOperations');
const axios = require('axios');
const sleep = require('sleep');

const CITIES_FILE_PATH = '../../../data/test.json';
const write_path = '../../../data/citiesWithAlt.json';
const API_URL = 'https://maps.googleapis.com/maps/api/elevation/json?locations=';
const API_URL2 = 'https://api.open-elevation.com/api/v1/lookup\?locations\='

main();

async function main() {
  let cities = [];
  try {
    cities = await readCities(CITIES_FILE_PATH);
    let city;
    for (let i = 0; i < cities.length; i++) {
      city = cities[i];
      if (!city.hasOwnProperty('alt')) {
        const alt = await getAlt(city.lat, city.lng);
        city.alt = Math.round(alt * 100) / 100;
        console.log(city);
        sleep.sleep(2);
      }
    }
    // newCities = cities.map(async (city) => {
    //   const alt = await getAlt(city.lat, city.lng);
    //   city.alt = Math.round(alt * 100) / 100;
    //   console.log(city);
    //   sleep.sleep(2);
    // });
  } catch (error) {
    console.log('ERROR: ' + error);
  } finally {
    try {
      writeCities(CITIES_FILE_PATH, cities);
    }
    catch (error) {
      console.log('ERROR: ' + error);
    }
  }

}

async function getAlt(lat, lng) {
  const response = await axios.get(API_URL + lat + ',' + lng);
  if (response.data.status !== 'OK') { console.log('status'); throw new Error(response.data.error_message); }
  return response.data.results[0].elevation;
}