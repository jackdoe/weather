const mysql = require('mysql');
const fs = require('fs-extra'); //fs-extra
const Geohash = require("latlon-geohash");
const config = require('./myConfig.json');
// const dirPATH = `/tmp/todo`;
const dirPATH = `./results/archive`;
const disPATH = `/tmp/archive/`;
const output = {
    geohash5: 0,
    geohash3: 0,
    lat: null,
    sourceApi: 0,
    lng: null,
    symbol: null,
    fromHour: 0,
    altitude: null,
    fogPercent: null,
    pressureHPA: null,
    cloudinessPercent: null,
    windDirectionDeg: null,
    dewpointTemperatureC: null,
    windGustMps: null,
    humidityPercent: null,
    areaMaxWindSpeedMps: null,
    windSpeedMps: null,
    temperatureC: null,
    lowCloudsPercent: null,
    mediumCloudsPercent: null,
    highCloudsPercent: null,
    temperatureProbability: null,
    windProbability: null,
    updatedTimestamp: null,
}

const dataPathList = fs.readdirSync(dirPATH, "utf8");
// console.log("TCL: dataPathList", dataPathList);
for(let i = 0; i < dataPathList.length; i++) {
    const path = `${dirPATH}/${dataPathList[i]}`;
    // console.log(path);
    const data = fs.readFileSync(path, "utf8");
    // console.log('TCL: data', data);
    const results = JSON.parse(data);
    // console.log(results);
    
    console.log(results)

    const connection = mysql.createConnection(config.dbConfig);
    
    results.forEach(result => {
        for (let i = 0; i < result.weather; i ++) {
            output.geohash5 = Geohash.encode(result.location.lat, result.location.lng, 5) || 0;
            output.geohash3 = Geohash.encode(result.location.lat, result.location.lng, 3) || 0;
            output.lat = result.location.lat || null;
            output.sourceApi = "https://opendata-download-metfcst.smhi.se";
            output.lng = result.location.lng || null;
            output.altitude = result.location.alt || null;
            output.symbol = result.weather[i].weatherCategory || null;
            output.fromHour = result.weather[i].time;
            output.fogPercent = result.weather[i].fogPercent || null;
            output.pressureHPA = result.weather[i].pressureHPA || null;
            output.cloudinessPercent = result.weather[i].cloudinessPercent || null;
            output.windDirectionDeg = result.weather[i].windDirectionDeg || null;
            output.dewpointTemperatureC = result.weather[i].dewpointTemperatureC || null;
            output.windGustMps = result.weather[i].windGustMps || null;
            output.humidityPercent = result.weather[i].humidityPercent || null;
            output.areaMaxWindSpeedMps = result.weather[i].areaMaxWindSpeedMps || null;
            output.windSpeedMps = result.weather[i].windSpeedMps || null;
            output.temperatureC = result.weather[i].temperatureC || null;
            output.lowCloudsPercent = result.weather[i].lowCloudsPercent ||null;
            output.mediumCloudsPercent = result.weather[i].mediumCloudsPercent || null;
            output.highCloudsPercent = result.weather[i].highCloudsPercent || null;
            output.temperatureProbability = result.weather[i].temperatureProbability || null;
            output.windProbability = result.weather[i].windProbability || null;
            output.updatedTimestamp = result.location.timeStamp || null;
            connection.connect((err) => {
            if (err) {
                console.error(`error connecting: ${err.stack}`);
                throw(err);
            }
            console.log(`connected as id ${connection.threadId}`);

            });
            connection.query("insert into weather set?", output);
            console.log(output);
        
        }
    })
    connection.end();
    fs.moveSync(path, `${disPATH}/${dataPathList[i]}`);
}
