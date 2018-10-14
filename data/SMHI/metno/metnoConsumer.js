const pool = require('./database.js');
const fs = require('fs-extra');
const Geohash = require("latlon-geohash");
const dirPATH = `/tmp/todo/metno`;
const disPATH = `/tmp/archive/`;

const dataPathList = fs.readdirSync(dirPATH, "utf8");

for (let i = 0; i < dataPathList.length; i++) {
    const path = `${dirPATH}/${dataPathList[i]}`;
    const data = fs.readFileSync(path, "utf8");
    const results = JSON.parse(data);

    results.forEach((result, index) => {
        for (let j = 0; j < result.weather.length; j++) {
            const geohash5 = `"${Geohash.encode(result.location.lat, result.location.lng, 5)}"`;
            const geohash3 = `"${Geohash.encode(result.location.lat, result.location.lng, 3)}"`;
            const sourceApi = "smhi";
            const sql = `INSERT INTO weather (geohash5, geohash3, lat, sourceApi, lng, symbol, fromHour, pressureHPA, cloudinessPercent, windDirectionDeg, humidityPercent, windSpeedMps, temperatureC, lowCloudsPercent, mediumCloudsPercent, highCloudsPercent, updatedTimestamp) VALUES(${geohash5}, ${geohash3}, ${result.location.lat}, "${sourceApi}", ${result.location.lng}, "${result.weather[j].weatherCategory.replace(" ", "_")}", ${result.weather[j].time}, ${result.weather[j].pressureHPA}, ${result.weather[j].cloudinessPercent}, ${result.weather[j].windDirectionDeg}, ${result.weather[j].humidityPercent}, ${result.weather[j].windSpeedMps}, ${result.weather[j].tempC}, ${result.weather[j].lowCloudsPercent}, ${result.weather[j].mediumCloudsPercent}, ${result.weather[j].highCloudsPercent}, ${result.location.timeStamp})`;
            pool.query(sql, (err) => {
                if (err) {
                    console.log(`Error: inserting into weather - ${err.message}`);
                    return;
                }
                console.log(`Success writing output${j} from city ${index} to weather table`);
            });

        }
    })
    fs.moveSync(path, `${disPATH}/${dataPathList[i]}`);
}