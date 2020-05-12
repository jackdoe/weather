'use strict';

const parseString = require('xml2js').parseString;
const axios = require('axios');
const sleep = require('sleep');
const geohash = require('latlon-geohash');
const mysql = require('mysql');
const { promisify } = require('util');
const { readJSONFile } = require('./fileOperations');

const CITIES_FILE = './top-1000-cities.json';
const METNO_API_URL = 'https://api.met.no/weatherapi/locationforecast/1.9/?lat=';
const { SLEEP_IN_SECOND, DB_CONFIG } = require('../config/config.js');

async function main() {

  let dbConnection;
  try {

    let cities = await readJSONFile(CITIES_FILE);
    cities = await shuffle(cities);

    dbConnection = mysql.createConnection({
      ...DB_CONFIG
    });

    for (let i = 0; i < cities.length; i++) {

      const { lat, lng, alt } = cities[i];
      const response = await getData(lat, lng, alt);

      if (response) {
        const xml = await parseStringWithPromise(response);
        console.log(`city ${lat}, ${lng} fetched`);
        const cityObj = {
          location: {
            lat,
            lng
          }
        }

        let weather = [];
        const updatedTimestamp = Date.parse(xml.weatherdata.meta[0].model[0].$.runended) / 1000;

        const filtered = xml.weatherdata.product[0].time.filter(
          obj => obj.location[0].hasOwnProperty('temperature'));
        console.log(filtered.length);
        weather = filtered.reduce((acc, elem, index) => (
          [...acc, {
            updatedTimestamp,
            fromHour: Date.parse(elem.$.from) / 1000,
            toHour: Date.parse(elem.$.to) / 1000,
            altitude: alt,
            temperatureC: getSafe(() => elem.location[0].temperature[0].$.value, null),
            fogPercent: getSafe(() => elem.location[0].fog[0].$.percent, null),
            pressureHPA: getSafe(() => elem.location[0].pressure[0].$.value, null),
            cloudinessPercent: getSafe(() => elem.location[0].cloudiness[0].$.percent, null),
            windDirectionDeg: getSafe(() => elem.location[0].windDirection[0].$.deg, null),
            dewpointTemperatureC: getSafe(() => elem.location[0].dewpointTemperature[0].$.value, null),
            windGustMps: getSafe(() => elem.location[0].windGust[0].$.mps, null),
            areaMaxWindSpeedMps: getSafe(() => elem.location[0].areaMaxWindSpeed[0].$.mps, null),
            humidityPercent: getSafe(() => elem.location[0].humidity[0].$.value, null),
            windSpeedMps: getSafe(() => elem.location[0].windSpeed[0].$.mps, null),
            lowCloudsPercent: getSafe(() => elem.location[0].lowClouds[0].$.percent, null),
            mediumCloudsPercent: getSafe(() => elem.location[0].mediumClouds[0].$.percent, null),
            highCloudsPercent: getSafe(() => elem.location[0].highClouds[0].$.percent, null)
          }]
        ), []);

        cityObj.weather = weather;

        insertToDB(dbConnection, { ...cityObj });

        sleep.sleep(SLEEP_IN_SECOND);

      }

    }

  } catch (error) {
    console.error(error);
  } finally {
    dbConnection.end();
  }

}

const parseStringWithPromise = promisify(parseString);

async function insertToDB(connection, cityObj) {

  const geohash3 = geohash.encode(cityObj.location.lat, cityObj.location.lng, 3);
  const geohash5 = geohash.encode(cityObj.location.lat, cityObj.location.lng, 5);
  const lat = +cityObj.location.lat.toFixed(2);
  const lng = +cityObj.location.lng.toFixed(2);
  const sql =
    'REPLACE INTO weather_monitoring (geohash5, geohash3, lat, sourceApi, lng, fromHour, altitude,\
           fogPercent, pressureHPA, cloudinessPercent, windDirectionDeg, dewpointTemperatureC, windGustMps,\
           areaMaxWindSpeedMps, humidityPercent, windSpeedMps, temperatureC, lowCloudsPercent,\
           mediumCloudsPercent,highCloudsPercent, updatedTimestamp) VALUES ?';

  const values = [];

  cityObj.weather.forEach(elem => {
    values.push([geohash5, geohash3, lat, 'metno', lng, elem.fromHour, elem.altitude, elem.fogPercent,
      elem.pressureHPA, elem.cloudinessPercent, elem.windDirectionDeg,
      elem.dewpointTemperatureC, elem.windGustMps, elem.areaMaxWindSpeedMps, elem.humidityPercent,
      elem.windSpeedMps, elem.temperatureC, elem.lowCloudPercent, elem.mediumCloudPercent,
      elem.highCloudPercent, elem.updatedTimestamp]);

  });
  connection.query(sql, [values],
    (err, result) => {
      if (err) console.error(err);
      else console.log(result.affectedRows + ' rows inserted');
    });
}

function getSafe(fn, defaultVal) {
  try {
    return fn();
  } catch (e) {
    return defaultVal;
  }
}

async function shuffle(array) {
  let currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}


async function getData(lat, lng, alt) {
  try {
    const response = await axios.get(`${METNO_API_URL}${lat}&lon=${lng}&msl=${alt}`);
    return response.data;
  } catch (error) {
    console.error(error);
  }
}

main();