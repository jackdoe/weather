const mysql = require("mysql");
const fs = require("fs");
const fsExtra = require("fs-extra");
const geoHash = require("latlon-geohash");
const Promise = require("bluebird");
const _ = require("lodash");
const todo = "./tmp/todo";
const archive = "./tmp/archive";

const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Modrab@99",
  database: "climate"
});

connection.connect(function(err) {
  if (err) {
    console.log(err);
  }
  console.log("Connected");
});

const files = fs.readdirSync(todo);
files.forEach(file => {
  let content = require(`${todo}/${file}`);
  const sqlStatements = content.map(loc => {
    const { lat, lng } = loc.location;
    const geohash3 = geoHash.encode(lat, lng, 3);
    const geohash5 = geoHash.encode(lat, lng, 5);
    return loc.weather.map(wts => {
      return `insert into weather(
        sourceApi, geohash3, geohash5, lat,lng,fromHour,temperatureC,pressureHPA,windSpeedMps,
        humidityPercent) values ("UAE","${geohash3}","${geohash5}",${lat},${lng},${
        wts.time
      },${wts.tempC},${wts.pressure},${wts.windSpeed},${wts.humidity});`;
    });
  });

  Promise.mapSeries(_.flatten(sqlStatements), sql => {
    connection.query(sql, function(err, result) {
      if (err) {
        return console.log(err);
      }
      console.log("Table updated");
    });
  });
  fsExtra.moveSync(`${todo}/${file}`, `${archive}/${file}`);
});
