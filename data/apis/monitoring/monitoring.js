'use strict';

const mysql = require('mysql');
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
    console.log(runTimestamp);

    const sql = 'SELECT COUNT(geohash5) AS count, SUM(temperatureC), SUM(windSpeedMps), SUM(pressureHPA),\
    MAX(updatedTimestamp) FROM weather WHERE sourceApi = ? AND fromHour = ? ';

    for (let i = 0; i < sourceApis.length; i++) {
      const result = await dbConnection.query(sql, [sourceApis[i], hourTimestamp]);
      console.log(result);
      if (result.length > 0)
        await writeStats(dbConnection, sourceApis[i], runTimestamp, result[0]);
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


