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
    let content = require(`${todo}/${file}`);
    for (let i = 0; i < content.length; i++) {

        let table = `insert into weather_metno(sourceApi, geohash3, geohash5, lat,lng, symbol,fromHour,toHour,temperatureC,pressureHPA,windSpeedMps,humidityPercent,updatedTimeStamp, altitude, fogPercent, windDirectionDeg,dewpointTemperatureC,lowCloudsPercent,mediumCloudsPercent,highCloudsPercent) values ("metno", "${geoHash.encode(content[i].location.lat, content[i].location.lng, 3)}", "${geoHash.encode(content[i].location.lat, content[i].location.lng, 5)}",${content[i].location.lat.toFixed(3)},${content[i].location.lng.toFixed(3)},"${content[i].weather[0].symbol}", ${content[i].weather[0].from},${content[i].weather[0].to},${content[i].weather[0].temperature}, ${content[i].weather[0].pressure}, ${content[i].weather[0].windSpeed},${content[i].weather[0].humidity},${content[i].weather[0].updatedTimeStamp}, ${content[i].location.alt}, ${content[i].weather[0].fog}, ${content[i].weather[0].windDirectionDeg},${content[i].weather[0].dewPointTemperature},${content[i].weather[0].lowClouds},${content[i].weather[0].mediumClouds},${content[i].weather[0].highClouds});`

        con.query(table, function (err, result) {
            if (err) { console.log(err) };
            console.log("Table updated");
        });
    };
    fsExtra.moveSync(`${todo}/${file}`, `${archive}/${file}`)
});
