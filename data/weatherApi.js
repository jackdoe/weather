const express = require("express");
const app = express();
const mysql = require('mysql');
const morgan = require('morgan');
const geoHash = require('latlon-geohash');
const sortByDistance = require("sort-by-distance");
app.use(morgan('short'));

const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "amir",
  database: "weather",
  multipleStatements: true,
  debug: false
});

connection.connect(function (err) {
  if (err) {
    console.log(err);
  }
  console.log("Connected");
});

app.get('/api/weather/:data', (req, res) => {

  // Extracting lat,lng,time from user inputs
  const data = req.params.data.split(",");
  const records = data.map(record => {
    const params = record.split("&");
    const items = params.map(param => {
      const item = param.split("=");
      return Number(item[1]);
    });
    return items;
  });
  const values = [];
  records.forEach(record => {
    const geoHash3 = geoHash.encode(record[0], record[1], 3);
    const time = record[2];
    values.push([geoHash3, time]);
  });

  // parseInt(time / 3600) * 3600;


  const queryPattern = "SELECT * FROM weather where geohash3 = ? && fromHour = ?;";
  let queryGeo3 = "";
  const queryCoords = [];
  for (let i = 0; i < values.length; i++) {
    queryGeo3 += queryPattern;
    for (let j = 0; j < values[i].length; j++) {
      queryCoords.push(values[i][j]);
    }
  }

  connection.query(queryGeo3, queryCoords, (err, rows) => {
    if (err) {
      console.log("Failed fetching the file " + err);
      } else if (rows.length === 0) {
        res.send("We dont have any information with the data you entered.");
    } else {
      console.log("Fetched successfully");
      
      // Set the items for each query to sort
      let sortItems = [];
      for (let i = 0; i < rows.length; i++) {
        for (let j = i; j < i + 1; j++) {
          const point = rows[i];
            const opts = { yName: "lat", xName: "lng" };
            const origin = { lat: records[j][0], lng: records[j][1] };
            const arr = sortByDistance(origin, point, opts)[0]
            sortItems.push(arr);
        }
      }

      // Coords that user entered
      let locations = []
      sortItems.forEach(obj => {
        if (obj) {
          locations.push([
            {
              lat: obj.lat,
              lng: obj.lng,
              timestamp: obj.fromHour
            }
          ])
        }
      });

      // Flatten the array 
      const finalLocation = [].concat.apply([], locations);
      
      res.json([sortItems,finalLocation])
    }
  });
})


app.get('/api/weather/', (req, res) => {
  const queryString = `SELECT * FROM weather`;
  connection.query(queryString, (err, rows, flieds) => {
    if (err) {
      console.log("Failed fetching the file" + err);
      res.status(500);
      res.end();
      return;
    }
    console.log("Fetched successfully");
    res.json(rows);
  })
});

app.listen(5000, () => console.log('Listening on port 5000'));
