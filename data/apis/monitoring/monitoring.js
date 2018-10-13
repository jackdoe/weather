'use strict';

const mysql = require('mysql');
const { writeJSONFile } = require('./fileOperations');
const moment = require('moment');

const { DB_CONFIG } = require('../config/config');
const STATES_FILES_PATH = './states/';

const sourceApis = ['iceland', 'usa', 'netherlands'];

const dbConnection = mysql.createConnection({
  ...DB_CONFIG
});

const nowTimestamp = Math.floor(Date.now() / 1000);

const sql = 'SELECT count(a.geohash5), sum(a.temperatureC), sum(a.windSpeedMps), sum(a.pressureHPA),\
 a.geohash5, a.updatedTimestamp from weather a \
INNER JOIN ( select geohash5, Max(updatedTimestamp) updatedTimestamp FROM weather Group by geohash5) b \
on  a.geohash5 = b.geohash5 and a.updatedTimestamp = b.updatedTimestamp \
 WHERE a.sourceApi = ? AND a.fromHour <= ? AND a.toHour >= ? ';

sourceApis.forEach(sourceApi => {
  dbConnection.query(sql, [sourceApi, nowTimestamp, nowTimestamp],
    (err, result) => {
      if (err) throw err;
      writeState(sourceApi, nowTimestamp, result[0]);
    });

});

dbConnection.end();

function writeState(nameOfApi, timeStampRun, data) {
  try {
    const state = {
      timeStampRun,
      sumOfTempC: data['sum(a.temperatureC)'],
      sumOfWind: data['sum(a.windSpeedMps)'],
      sumOfPressure: data['sum(a.pressureHPA)'],
      lastUpdate: data['updatedTimestamp']
    }
    writeJSONFile(`${STATES_FILES_PATH}${nameOfApi}.${moment(timeStampRun * 1000).format('YYMMDDHHmm')}.state.json`, state);
  } catch (error) {
    console.error('Error writing state file ' + nameOfApi);
  }
}