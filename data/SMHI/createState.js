'use strict';
const fs = require('fs');
const moment = require('moment');
// const fetch = require("node-fetch");
// const sleep = require("sleep");
// const parseString = require('xml2js').parseString;
// const metnoPath = "https://api.met.no/weatherapi/locationforecast/1.9";
// const cityTestNumber = 5;
const statsPATH = `${moment().format("YYYYMMDDHHmm")}.stats.json`;
const listStatsPATH = `../monitor-smhi/src/sources/listStats.json`;
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



const jsonPathList = fs.readFileSync( "listPATH.json", 'utf8');
const dataPathList = JSON.parse(jsonPathList);

for (let i = 0; i < dataPathList.length; i++){
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
    //creating stats for each date
    
    console.log('calculating stats');
        //creating new empty file dated per day
        
    if (!fs.existsSync(statsPATH)) {
        fs.writeFileSync(statsPATH, JSON.stringify([]));
    }
    const data = fs.readFileSync(dataPathList[i], "utf8");
    const results = JSON.parse(data);

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
    if (i !== dataPathList.length || dataPathList[i + 1].slice(0, 14) > dataPathList[i].slice(0, 14)) {
        const list = [];
        list.push(stats);
        console.log("list: ", list[0]);
        if (!fs.existsSync(listStatsPATH)) {
            fs.writeFileSync(listStatsPATH, JSON.stringify([]));
        }
        const jsonStats = fs.readFileSync(listStatsPATH, 'utf8');
        const listStats = JSON.parse(jsonStats);
        listStats.push(list[0]);
        fs.writeFileSync(listStatsPATH, JSON.stringify(listStats), null, 2);
        fs.writeFileSync(statsPATH, JSON.stringify(stats), null, 2);
        console.log(`stats is saved!`);
    }

}
if (!fs.existsSync(listStatsPATH)) {
    fs.writeFileSync(listStatsPATH, JSON.stringify([]));
}
const jsonStats = fs.readFileSync(listStatsPATH, 'utf8');
const listStats = JSON.parse(jsonStats);
listStats.push(stats);
fs.writeFileSync(listStatsPATH, JSON.stringify(listStats), null, 2);
fs.writeFileSync(statsPATH, JSON.stringify(stats), null,2);
console.log(`stats is saved!`);
