'use strict';

const mysql = require('mysql');
const geolib = require('geolib');
const { writeJSONFile } = require('./fileOperations');
const moment = require('moment');
const { promisify } = require('util');

const { DB_CONFIG } = require('../config/config');
const STATS_FILES_PATH = './stats/';

const sourceApis = ['netherlands', 'metno'];

async function main() {

  let dbConnection;
  try {

    dbConnection = mysql.createConnection({
      ...DB_CONFIG
    });

    dbConnection.query = promisify(dbConnection.query);

    const runTimestamp = Math.floor(Date.now() / 1000);
    const hourTimestamp = parseInt(runTimestamp / 3600) * 3600;
    console.log(hourTimestamp);

    const sqlMonitoringTable =
      'SELECT geohash5, geohash3, lat, lng, temperatureC FROM weather_monitoring WHERE fromHour = ? ';

    const sqlWeatherTable =
      'SELECT sourceApi, geohash5, geohash3, lat, lng, temperatureC FROM weather WHERE fromHour = ? AND geohash3 = ?';

    const results = await dbConnection.query(sqlMonitoringTable, hourTimestamp);
    // console.log(results);

    results.forEach(async (result) => {

      const weatherResults = await dbConnection.query(sqlWeatherTable, [hourTimestamp, result.geohash3]);
      if (weatherResults.length > 0) {
        console.log(result.geohash5, weatherResults);
        const sameGeohash5 = weatherResults.filter(weatherResult => {
          // console.log(weatherResult.geohash5);
          return weatherResult.geohash5 === result.geohash5
        });
        if (sameGeohash5.length > 0) {
          console.log('found 5 ', sameGeohash5);
        }
        else {
          let closest = geolib.getDistance({ latitude: weatherResults[0].lat, longitude: weatherResults[0].lng },
            { latitude: result.lat, longitude: result.lng });
          let closestIndex = 0;
          for (let i = 1; i < weatherResults.length; i++) {
            let distance = geolib.getDistance({ latitude: weatherResults[i].lat, longitude: weatherResults[i].lng },
              { latitude: result.lat, longitude: result.lng });
            console.log(distance);
            if (distance < closest) {
              closest = distance;
              closestIndex = i;
            }
          }
          console.log(closest, weatherResults[closestIndex]);
          // const distanceArray = weatherResults.map(weatherResult =>
          //   geolib.getDistance({ latitude: weatherResult.lat, longitude: weatherResult.lng },
          //     { latitude: result.lat, longitude: result.lng }));
          // const min = Math.min(...distanceArray);
          // console.log('found 4 ', min);
        }
      }

    });

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

  const insertValues = (data.count === 0) ? [runTimestamp, sourceApi, data.count, 0, 0, 0, 0] :
    [runTimestamp, sourceApi, data.count, +data['SUM(temperatureC)'].toFixed(2),
      +data['SUM(windSpeedMps)'].toFixed(2), +data['SUM(pressureHPA)'].toFixed(2), data['MAX(updatedTimestamp)']];

  console.log(insertValues);

  connection.query(insertSql, insertValues,
    (err, result) => {
      if (err) throw err;
      console.log(result.affectedRows + ' rows inserted for ' + sourceApi + ' API');
    });

}


