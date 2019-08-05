const mysql = require("mysql");
const fs = require("fs");
const fse = require("fs-extra");
const geoHash = require("latlon-geohash");

const todoDir = "./tmp/todo";
const archiveDir = "./tmp/archive";

const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "hi",
  database: "weather"
});

connection.connect(err => err && console.error(err));

const files = fs.readdirSync(todoDir);

files.forEach(file => {
  const content = require(`${todoDir}/${file}`);
  const values = [];

  const storeWeatherQuery =
    "REPLACE INTO weather(sourceApi, geohash5, geohash3, fromHour, lat, lng, symbol, pressureHPA, humidityPercent, windSpeedMps, temperatureC, updatedTimestamp, cloudinessPercent) VALUES ?";

  for (let i = 0; i < content.length; i++) {
    const { lat, lng } = content[i].location;
    const {
      timeStamp,
      pressureHPA,
      humidityPercent,
      windSpeedMS,
      temperatureC,
      cloudsPercent,
      description
    } = content[i].weather;

    const geohash5 = geoHash.encode(lat, lng, 5);
    const geohash3 = geoHash.encode(lat, lng, 3);
    const fixedTime = Math.floor(timeStamp / 3600) * 3600;
    values.push([
      "Korea Meteorological Administration",
      geohash5,
      geohash3,
      fixedTime,
      lat,
      lng,
      description,
      pressureHPA,
      humidityPercent,
      windSpeedMS,
      temperatureC,
      timeStamp,
      cloudsPercent
    ]);

    connection.query(storeWeatherQuery, () => {
      console.log(
        `inserted/replaced entries with geohash5 of (${geohash5}) into table weather`
      );
    });
  }

  fse.moveSync(`${todoDir}/${file}`, `${archiveDir}/${file}`);
});

connection.end(err => err && console.error(err));
