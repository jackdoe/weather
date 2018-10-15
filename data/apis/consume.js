'use strict';

const requireDir = require('require-dir');
const geohash = require('latlon-geohash');
const mysql = require('mysql');
const fs = require('fs-extra');

const { DB_CONFIG } = require('./config/config');
const TODO_DIR_PATH = './tmp/todo';
const ARCHIVE_DIR_PATH = './archive';
const weatherFiles = requireDir(TODO_DIR_PATH);

if (Object.keys(weatherFiles).length === 0) return console.log('All files are already inserted');

const dbConnection = mysql.createConnection({
  ...DB_CONFIG
});

dbConnection.connect(function (err) {
  if (err) {
    console.error('error connecting: ' + err.stack);
    return;
  }

  for (let file in weatherFiles) {
    const sourceApi = file.split('.')[0];

    const sql =
      'REPLACE INTO weather (geohash5, geohash3, lat, sourceApi, lng, symbol, fromHour, altitude,\
           fogPercent, pressureHPA, cloudinessPercent, windDirectionDeg, dewpointTemperatureC, windGustMps,\
            humidityPercent, areaMaxWindSpeedMps, windSpeedMps, temperatureC, lowCloudsPercent,\
             mediumCloudsPercent, highCloudsPercent, temperatureProbability, windProbability,\
              updatedTimestamp) VALUES ?';


    weatherFiles[file].forEach(locationElement => {

      const values = [];

      const geohash3 = geohash.encode(locationElement.location.lat, locationElement.location.lng, 3);
      const geohash5 = geohash.encode(locationElement.location.lat, locationElement.location.lng, 5);
      const lat = +locationElement.location.lat.toFixed(2);
      const lng = +locationElement.location.lng.toFixed(2);

      locationElement.weather.forEach(elem => {

        values.push([geohash5, geohash3, lat, sourceApi, lng, elem.symbol, elem.fromHour,
          elem.altitude, elem.fogPercent, elem.pressureHPA, elem.cloudinessPercent, elem.windDirectionDeg,
          elem.dewpointTemperatureC, elem.windGustMps, elem.humidityPercent, elem.areaMaxWindSpeedMps,
          elem.windSpeedMps, elem.temperatureC, elem.lowCloudPercent, elem.mediumCloudPercent,
          elem.highCloudPercent, elem.temperatureProbability, elem.windProbability, elem.updatedTimestamp]);

      });

      dbConnection.query(sql, [values],
        (err, result) => {
          if (err) console.error(err);
          else console.log(result.affectedRows + ' rows inserted');
        });

    });

    fs.move(`${TODO_DIR_PATH}/${file}.json`, `${ARCHIVE_DIR_PATH}/${file}.json`, (err) => {
      if (err) throw err;
      console.log('File moved!');
    });

  }

  dbConnection.end();
});