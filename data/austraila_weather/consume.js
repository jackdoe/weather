const fs = require('fs');
const fsExtra = require('fs-extra');
const mysql = require('mysql');
const todo = './tmp/todo';
const geoHash = require('latlon-geohash');
const archive = './australia_archive';

const con = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '*******',
  database: 'weather'
});

con.connect(function (err) {
  if (err) {
    console.log(err);
  }
  console.log('Connected');
});

const fileRoot = './tmp/todo/australia.json'

const files = fs.readdirSync(todo)
files.forEach(file => {
  let content = require(fileRoot);
  for (let i = 0; i < content.length; i++){
    let table = `insert into weather(sourceApi,geohash5,geohash3,fromHour,lat,lng,altitude,pressureHPA,dewpointTemperatureC,windGustMps,humidityPercent,windSpeedMps,temperatureC,updatedTimestamp) values ('Australia', '${geoHash.encode(content[i].location.lat, content[i].location.lng, 5)}','${geoHash.encode(content[i].location.lat, content[i].location.lng, 3)}', ${content[i].weather[0].last_updated} , ${content[i].location.lat} , ${content[i].location.lng} , ${content[i].location.altM}, ${content[i].weather[0].pressureHpa},${content[i].weather[0].dewPointC},${content[i].weather[0].windGustMps},${content[i].weather[0].humidityPercent},${content[i].weather[0].windSpeedMps},${content[i].weather[0].tempC},${content[i].weather[0].time_stamp});`;

    con.query(table, function (err, result) {
      if (err) {
        console.log(err)
      };
      console.log('Table updated');
    });
  }
  fsExtra.moveSync( fileRoot , `${archive}/${file}`)
})
con.end(err => err && console.error);//

