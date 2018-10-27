const fs = require("fs");
const path = require("path");
const _ = require("underscore");
const folder = "./todo";
const config = require("./config.json");
const password = config.databasePassword;

getMostRecentFile = dir => {
  let files = fs.readdirSync(dir);

  return _.max(files, f => {
    let fullpath = path.join(dir, f);

    return fs.statSync(fullpath).ctime;
  });
};

let latestFile = getMostRecentFile(folder);

let data = fs.readFileSync(path.join(folder, latestFile), "utf-8");
let dataOBJ = JSON.parse(data);

var mysql = require("mysql");

var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: password,
  database: "GB_weather"
});

con.connect(err => {
  if (err) throw err;
  console.log("Connected!");
  console.log("66 records is to be inserted.");

  for (let i = 0; i < dataOBJ.length; i++) {
    const lat = dataOBJ[i].location.latitude;
    const lng = dataOBJ[i].location.longitude;
    const cityName = dataOBJ[i].location.city;
    const altitude = dataOBJ[i].location.altitude;

    dataOBJ[i].weather.map(weatherArray => {
      const date = weatherArray.date;
      const geohash3 = weatherArray.geohash3;
      const geohash5 = weatherArray.geohash5;
      const sourceApi = weatherArray.sourceApi;
      const fromHour = weatherArray.fromHour;
      const toHour = weatherArray.toHour;
      const symbol = weatherArray.symbol;
      const pressureHPA = weatherArray.pressureHPA;
      const cloudinessPercent = weatherArray.cloudinessPercent;
      const windDirectionDeg = weatherArray.windDirectionDeg;
      const dewpointTemperatureC = weatherArray.dewpointTemperatureC;
      const humidityPercent = weatherArray.humidityPercent;
      const windSpeedMps = weatherArray.windSpeedMps;
      const windGustMps = weatherArray.windGustMps;
      const temperatureC = weatherArray.temperatureC;
      const lowCloudsPercent = weatherArray.lowCloudsPercent;
      const mediumCloudsPercent = weatherArray.midCloudsPercent;
      const highCloudsPercent = weatherArray.highCloudsPercent;
      const feelsLikeC = weatherArray.feelsLikeC;
      const visibilityKm = weatherArray.visibilityKm;

      let values = [
        lat,
        lng,
        altitude,
        geohash3,
        geohash5,
        sourceApi,
        fromHour,
        toHour,
        symbol,
        pressureHPA,
        cloudinessPercent,
        windDirectionDeg,
        dewpointTemperatureC,
        humidityPercent,
        windSpeedMps,
        windGustMps,
        temperatureC,
        lowCloudsPercent,
        mediumCloudsPercent,
        highCloudsPercent
      ];
      var sql =
        "UPDATE  weather SET lat=?, lng=?, altitude=?,  geohash3=?,  geohash5=?,  sourceApi=?,fromHour=?, toHour=?, symbol=?, pressureHPA=?, cloudinessPercent=?,  windDirectionDeg=?, dewpointTemperatureC=?,  humidityPercent=?,   windSpeedMps=?, windGustMps=?,  temperatureC=?, lowCloudsPercent=?, mediumCloudsPercent=?, highCloudsPercent=?";
      con.query(sql, values, (err, result) => {
        if (err) throw err;
        console.log(`Number of records inserted: ${i}  ${cityName}`);
      });
    });
  }

  con.end();
});
