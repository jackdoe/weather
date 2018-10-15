"use strict"
const fs = require('fs');
const fsExtra = require('fs-extra')
const mysql = require('mysql');
const geoHash = require('latlon-geohash');
const todo = './tmp/todo/';
const archive = './tmp/archive';

const con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "password",
    database: "weather"
});

con.connect(function (err) {
    if (err) { console.log(err) };
    console.log("Connected!");
});

const files = fs.readdirSync(todo)
files.forEach(file => {
    let content = require(`${todo}${file}`);
    for (let i = 0; i < content.length; i++) {

        let table = `insert into weather(sourceApi, geohash3, geohash5, lat,lng, symbol,fromHour,toHour,temperatureC,pressureHPA,windSpeedMps,humidityPercent,updatedTimeStamp) values ("RMI Europe", "${geoHash.encode(content[i].location.lat, content[i].location.lng, 3)}", "${geoHash.encode(content[i].location.lat, content[i].location.lng, 5)}",${content[i].location.lat.toFixed(3)},${content[i].location.lng.toFixed(3)},"${content[i].weather[0].WeatherType}", ${content[i].weather[0].From},${content[i].weather[0].To},${content[i].weather[0].Temperature}, ${content[i].weather[0].Pressure}, ${content[i].weather[0].WindSpeed},${content[i].weather[0].Humidity},${content[i].weather[0].UpdatedTimeStamp});`

        con.query(table, function (err, result) {
            if (err) { console.log(err) };
            console.log("Table updated");
        });
    };
    fsExtra.moveSync(`${todo}/${file}`, `${archive}/${file}`)
});
