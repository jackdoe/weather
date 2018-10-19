'use strict';

const mysql = require('mysql');
const geolib = require('geolib');
const { promisify } = require('util');

const { DB_CONFIG, SOURCE_APIS } = require('../config/config');

const sourceDiff = [];

async function main() {

  let dbConnection;
  try {

    dbConnection = mysql.createConnection({ ...DB_CONFIG });
    dbConnection.query = promisify(dbConnection.query);

    const runTimestamp = Math.floor(Date.now() / 1000);
    const hourTimestamp = parseInt(runTimestamp / 3600) * 3600;

    const sqlMonitoringTable =
      'SELECT geohash5, geohash3, lat, lng, temperatureC FROM weather_monitoring WHERE fromHour = ? ';

    const sqlWeatherTable =
      'SELECT sourceApi, geohash5, geohash3, lat, lng, temperatureC FROM weather WHERE fromHour = ? AND geohash3 = ?';

    const monitoringResults = await dbConnection.query(sqlMonitoringTable, hourTimestamp);

    for (let i = 0; i < monitoringResults.length; i++) {

      const city = monitoringResults[i]
      const weatherResults = await dbConnection.query(sqlWeatherTable, [hourTimestamp, city.geohash3]);

      if (weatherResults.length > 0) {

        let closest = geolib.getDistance({ latitude: weatherResults[0].lat, longitude: weatherResults[0].lng },
          { latitude: city.lat, longitude: city.lng });
        let closestIndex = 0;

        for (let index = 1; index < weatherResults.length; index++) {
          const distance = geolib.getDistance(
            { latitude: weatherResults[index].lat, longitude: weatherResults[index].lng },
            { latitude: city.lat, longitude: city.lng });
          if (distance < closest) {
            closest = distance;
            closestIndex = index;
          }
        }

        sourceDiff.push({
          sourceApi: weatherResults[closestIndex].sourceApi,
          tempDiff: city.temperatureC - weatherResults[closestIndex].temperatureC
        });

      }

    }

    let diffArray = SOURCE_APIS.map(source => {
      let count = 0;
      const tempDiffC = sourceDiff.reduce((acc, elem) => {
        if (elem.sourceApi === source) {
          count++
          return acc + elem.tempDiff
        }
        return acc
      }, 0);
      return {
        sourceApi: source,
        tempDiffC,
        count
      };
    });
    console.log(diffArray);
    insertTempDiff(dbConnection, hourTimestamp, diffArray);

  }
  catch (error) {
    console.log(error)
  } finally {
    dbConnection.end();
  }

}

main();

function insertTempDiff(connection, hourTimestamp, diffArray) {

  const insertSql = 'UPDATE stats SET sumOfTempCDiff = ?, tempDiffCount = ? WHERE sourceApi = ? AND runTimestamp = ?';

  diffArray.map(elem =>

    connection.query(insertSql, [+elem.tempDiffC.toFixed(2), elem.count, elem.sourceApi, hourTimestamp],
      (err, result) => {
        if (err) throw err;
        console.log(result.affectedRows + ' rows updated for ' + elem.sourceApi);
      })

  );


}


