const fs = require('fs');
const moment = require('moment');
const countriesList = ['Åland', 'Belarus', 'Denmark', 'Estonia', 'Finland', 'Germany', 'Lithuania', 'Latvia', 'Norway', 'Netherlands', 'Poland', 'Russia', 'Svalbard and Jan Mayen', 'United Kingdom'];
const statsPATH = `${moment().format("YYYYMMDDHHmm")}.stats.json`;
const listStatsPATH = `listStats.json`;
let stats = {
    timestamprun: new Date().getTime(),
    nameofapi: "SMHI",
    countOfItems: 0,//(number of cities x number of forecasts, assuming they are the same every time for that run)
    sumOfTempc: 0,
    sumOfWind: 0,
    sumOfPressure: 0,
    sumOfHumidityPer: 0,
    sumOfCloudiness: 0,
    sumOfHCloudiness: 0,
    sumOfLCloudiness: 0,
    sumOfMCloudiness: 0,
    timeLastUpdate: 0,//the time the api last produced a forecast or measurement
    sumoftempcdiffwithmetno: 0,
    longlats: [0,0], // this should be length numberofcities
}
const jsonPathList = fs.readFileSync( "listPATH.json", 'utf8');
const dataPathList = JSON.parse(jsonPathList);

for (let i = 0; i < dataPathList.length; i++){

//creating new empty file dated per day
    if (!fs.existsSync(statsPATH)) {
        fs.writeFileSync(statsPATH, JSON.stringify([]));
    }
    const data = fs.readFileSync(dataPathList[i], "utf8");
    const results = JSON.parse(data);
    results.forEach(result => {
        // if (result.location.timeStamp !== undefined) {
        stats.timeLastUpdate = result.location.timeStamp || 0;
        // }
        // if (result.weather.length !== undefined) {
        stats.countOfItems += result.weather.length || 0;
        // }
        // if (result.location.lng !== undefined) {
        stats.longlats[0] += result.location.lng || 0;
        // }
        // if (result.location.lat !== undefined) {
        stats.longlats[1] += result.location.lat || 0;
        // }
        for (let i = 0; i < result.weather.length; i++) {
            // if (result.weather[i].pressureHPA !== undefined) {
            stats.sumOfPressure += result.weather[i].pressureHPA || 0;
            // }
            // if (result.weather[i].tempC !== undefined) {
            stats.sumOfTempc += result.weather[i].tempC || 0;
            // }
            // if (result.weather[i].windSpeedMps !== undefined) {
            stats.sumOfWind += result.weather[i].windSpeedMps || 0;
            // }
            // if (result.weather[i].humidityPercent !== undefined) {
            stats.sumOfHumidityPer += result.weather[i].humidityPercent || 0;
            // }
            // if (result.weather[i].cloudinessPercent !== undefined) {
            stats.sumOfCloudiness += result.weather[i].cloudinessPercent || 0;
            // }
            // if (result.weather[i].highCloudsPercent !== undefined) {
            stats.sumOfHCloudiness += result.weather[i].highCloudsPercent || 0;
            // }
            // if (result.weather[i].lowCloudsPercent !== undefined) {
            stats.sumOfLCloudiness += result.weather[i].lowCloudsPercent || 0;
            // }
            // if (result.weather[i].mediumCloudsPercent !== undefined) {
            stats.sumOfMCloudiness += result.weather[i].mediumCloudsPercent || 0;
            // }
            // stats.countOfUndefined += 1
        }
    });
}
if (!fs.existsSync(listStatsPATH)) {
    fs.writeFileSync(listStatsPATH, JSON.stringify([]));
}
const jsonStats = fs.readFileSync(listStatsPATH, 'utf8');
const listStats = JSON.parse(jsonStats);
listStats.push(stats);
console.log('TCL: stats', stats);
console.log('TCL: stats', stats);
fs.writeFileSync(`listStats.json`, JSON.stringify(listStats),null, 2);
fs.writeFileSync(statsPATH, JSON.stringify(stats), null,2);
console.log(`stats is saved!`);
