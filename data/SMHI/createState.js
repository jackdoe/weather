'use strict';
const fs = require('fs');
// const moment = require('moment');
// const fetch = require("node-fetch");
// const sleep = require("sleep");
// const parseString = require('xml2js').parseString;
// const metnoPath = "https://api.met.no/weatherapi/locationforecast/1.9";
// const cityTestNumber = 5;
const basePATH = `./results/stats/`;
// const listStatsPATH = `../monitor-smhi/src/sources/listStats.json`;
const dirPATH = `/tmp/todo`;
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
    longlats: [], // this should be length numberofcities
}


//creating an array of the files in the directory
const dataPathList = fs.readdirSync(dirPATH, 'utf8');
console.log('TCL: dataPathList', dataPathList);

for (let i = 0; i < dataPathList.length; i++){
    console.log(dataPathList[i].slice(0, 14));
     //creating new empty file dated per day
    const statsPATH = `${basePATH}${dataPathList[i].slice(0, 14)}.stats.json`; 
    if (!fs.existsSync(statsPATH)) {
      fs.writeFileSync(statsPATH, JSON.stringify([]), null, 2);
    }
    const path = `${dirPATH}/${dataPathList[i]}`;
    const data = fs.readFileSync(path, "utf8");
    const results = JSON.parse(data);
    // temporary will be replaced with the consume.js
    // fs.copyFileSync(path, `./results/archive/${dataPathList[i]}`);
    // fs.unlinkSync(path);

    results.forEach(result => { 
        //using || 0 as a replacement for undefined values
        stats.timeLastUpdate = result.location.timeStamp || 0;
        stats.countOfItems += result.weather.length || 0;
        if (result.location.cityName) {
        stats.longlats.push(
            {
                name: result.location.cityName,
                country: result.location.countryName,
                lng: result.location.lng,
                lat: result.location.lat
            });
        }
        for (let i = 0; i < result.weather.length; i++) {
            stats.sumOfPressure += result.weather[i].pressureHPA || 0;
            stats.sumOfTempc += result.weather[i].tempC || 0;
            stats.sumOfWind += result.weather[i].windSpeedMps || 0;
            stats.sumOfHumidityPer += result.weather[i].humidityPercent || 0;
            stats.sumOfCloudiness += result.weather[i].cloudinessPercent || 0;
            stats.sumOfHCloudiness += result.weather[i].highCloudsPercent || 0;
            stats.sumOfLCloudiness += result.weather[i].lowCloudsPercent || 0;
            stats.sumOfMCloudiness += result.weather[i].mediumCloudsPercent || 0;
        }
    });
    
    fs.writeFileSync(statsPATH, JSON.stringify(stats), null,2);
    console.log(`stats is saved!`);
}


