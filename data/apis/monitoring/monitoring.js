'use strict';

const mysql = require('mysql');
const { writeJSONFile } = require('./fileOperations');
const moment = require('moment');
const { promisify } = require('util');

const { DB_CONFIG } = require('../config/config');
const STATS_FILES_PATH = './stats/';

const sourceApis = ['metno'];

async function main() {
  let dbConnection;
  try {
    dbConnection = mysql.createConnection({
      // connectionLimit: 10,
      ...DB_CONFIG
    });

    dbConnection.query = promisify(dbConnection.query);

    const runTimestamp = Math.floor(Date.now() / 1000);
    const hourTimestamp = parseInt(runTimestamp / 3600) * 3600;
    console.log(runTimestamp);

    const sql = 'SELECT COUNT(geohash5), SUM(temperatureC), SUM(windSpeedMps), SUM(pressureHPA),\
 MAX(updatedTimestamp) FROM weather_monitoring  \
 WHERE sourceApi = ? AND fromHour = ? ';

    for (let i = 0; i < sourceApis.length; i++) {
      const result = await dbConnection.query(sql, [sourceApis[i], hourTimestamp])
      // // async (err, result) => {
      // //   if (err) throw err;
      // //   // console.log(result);
      await writeStats(dbConnection, sourceApis[i], runTimestamp, result[0]);
      // //   // const data = result[0];

      // });
      // console.log(rows);
    }
  }
  catch (error) {
    console.log(error)
  } finally {
    dbConnection.end();
  }

}
main();
function writeStats(connection, sourceApi, runTimestamp, data) {

  const insertSql = 'INSERT INTO stats (runTimeStamp, sourceApi, countofitems ,sumoftempc, sumofwindmps, sumofpressurehpa, \
    lastupdatetimestamp) values (?,?,?,?,?,?,?)';

  const insertValues = [runTimestamp, sourceApi, data['COUNT(geohash5)'], +data['SUM(temperatureC)'].toFixed(2),
    +data['SUM(windSpeedMps)'].toFixed(2), +data['SUM(pressureHPA)'].toFixed(2), data['MAX(updatedTimestamp)']];
  console.log(insertValues);
  connection.query(insertSql, insertValues,
    (err, result) => {
      if (err) throw err;
      // console.log(result);
      console.log(result.affectedRows + ' rows inserted for' + sourceApi);
    });

  // try {
  //   const stats = {
  //     runTimeStamp,
  //     sumOfTempC: data['SUM(temperatureC)'],
  //     sumOfWind: data['SUM(windSpeedMps)'],
  //     sumOfPressure: data['SUM(pressureHPA)'],
  //     lastUpdateTimestamp: data['MAX(updatedTimestamp)']
  //   }
  //   console.log(stats);
  //   writeJSONFile(`${STATS_FILES_PATH}${sourceApi}.${moment(timeStampRun * 1000).format('YYMMDDHHmm')}.stats.json`, stats);
  // } catch (error) {
  //   console.error('Error writing stats file ' + sourceApi);
}
// }

