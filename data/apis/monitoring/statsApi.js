const Express = require('express');
const mysql = require('mysql');
const { promisify } = require('util');

const { STATS_API_PORT, SOURCE_APIS, DB_CONFIG } = require('../config/config');

const app = Express();
const dbPool = mysql.createPool({
  connectionLimit: 10,
  ...DB_CONFIG
});

dbPool.query = promisify(dbPool.query);

const getSourceSql =
  'SELECT * FROM stats WHERE sourceApi = ? ORDER BY runTimestamp DESC';
const getTotalSql =
  'SELECT runTimeStamp, SUM(countOfItems) AS countOfItems, SUM(sumOfTempC) AS sumOfTempC,\
    SUM(sumOfWindMps) AS sumOfWindMps, SUM(sumOfPressureHPA) AS sumOfPressureHPA,\
    SUM(sumOfTempCDiff) AS sumOfTempCDiff, SUM(tempDiffCount) AS tempDiffCount\
    FROM stats GROUP BY runTimestamp ORDER BY runTimestamp DESC';
const getAllSql =
  'SELECT * FROM stats ORDER BY runTimestamp DESC';

app.get('/api/stats/total', (req, res, next) => {
  getStats(dbPool, getTotalSql, 'total')
    .then(results => res.json(results))
    .catch(err => next(err))
});

app.get('/api/stats/:sourceApi', (req, res, next) => {
  const sourceApi = req.params.sourceApi.toLowerCase();
  if (SOURCE_APIS.find((elem) => elem == sourceApi)) {
    getStats(dbPool, getSourceSql, sourceApi)
      .then(results => res.json(results))
      .catch(err => next(err))
  }
  else res.status(404).json({ error: `source API ${sourceApi} not found` });
});

app.get('/api/stats/', (req, res, next) => {

  getStats(dbPool, getAllSql)
    .then(results => {
      groupedResult = {};
      SOURCE_APIS.forEach((source) => {
        groupedResult[source] = results.filter((result) => result.sourceApi === source);
      });
      res.json(groupedResult)
    })
    .catch(err => next(err))

});

app.use((error, req, res, next) => {
  res.status(500).json({ response: error.message });
});

app.listen(STATS_API_PORT, () => console.log(`Listening on port ${STATS_API_PORT}`));

async function getStats(dbPool, sql, source) {

  let results = [];
  try {
    results = (source) ? await dbPool.query(sql, source) : await dbPool.query(sql);
  } catch (error) {
    console.error(error);
    throw new Error(`Error fetching data from database...`);
  }

  if (results.length === 0)
    throw new Error(`No data available for this request...`);
  return results;

}

