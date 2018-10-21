const cheerio = require('cheerio');
const axios = require('axios');
const moment = require('moment');
const Promise = require('bluebird');
const australiaLocations = require("./australiaLocations");
const fs = require('fs');
const _ = require('lodash');


const timeStamp = Math.floor(Date.now() / 1000);

const endPoints = [ "http://www.bom.gov.au/vic/observations/melbourne.shtml?ref=dropdown",
 "http://www.bom.gov.au/nsw/observations/sydney.shtml?ref=dropdown",
"http://www.bom.gov.au/qld/observations/brisbane.shtml?ref=dropdown",
"http://www.bom.gov.au/wa/observations/perth.shtml?ref=dropdown",
"http://www.bom.gov.au/sa/observations/adelaide.shtml?ref=dropdown",
"http://www.bom.gov.au/tas/observations/hobart.shtml?ref=dropdown",
"http://www.bom.gov.au/act/observations/canberra.shtml?ref=dropdown",
"http://www.bom.gov.au/nt/observations/darwin.shtml?ref=dropdown"
]

function getCityData(areaUrl) {
  return new Promise(async (resolve, reject) => {
    try {
      const urlResponse = await axios.get(areaUrl);
      const object = cheerio.load(urlResponse.data);
      const cities = object('tr > th > a')
        .toArray()
        .map(elem => elem.children[0].data)
        .map(city => {
          const cityCoords = australiaLocations.find(c =>
            new RegExp(`${c.name}\\b.*`, "i").test(city)
          );
          if (!cityCoords) return;
          return {
            name: city,
            lat: cityCoords.lat,
            lng: cityCoords.lng,
            altM: cityCoords.altM
          };
        })
      let utcTime;

      const header = object('h1')
        .toArray()
        .map(th => th.children[0] && th.children[0].data);
      
      const data = object('tbody > tr')
        .toArray()
        .map(row => row.children
          .filter(cell => cell.name === 'td' && cell.type === 'tag')
          .map(td => td.children[0] && td.children[0].data));
      
      const weatherInfo = data.map((arr) => {
        if (new RegExp('melbourne', 'i').test(header) || new RegExp('sydney', 'i').test(header) || new RegExp('canberra', 'i').test(header) || new RegExp('hobart', 'i').test(header)) {
          utcTime = moment(arr[0], "DD/hh:mma").unix() - 39600;
        } else if (new RegExp("brisbane", "i").test(header)) {
          utcTime = moment(arr[0], "DD/hh:mma").unix() - 36000;
        } else if (new RegExp("adelaide", "i").test(header)) {
          utcTime = moment(arr[0], "DD/hh:mma").unix() - 37800;
        } else if (new RegExp("darwin", "i").test(header)) {
          utcTime = moment(arr[0], "DD/hh:mma").unix() - 34200;
        } else if (new RegExp("perth", "i").test(header)) {
          utcTime = moment(arr[0], "DD/hh:mma").unix() - 28800;
        }
        return {
          "time_stamp": timeStamp,
          "last_updated": utcTime,
          "tempC": Number(Number((arr[1]).replace('-', '')).toFixed(0)),
          "appTempC": Number(arr[2]),
          "dewPointC": Number(arr[3]),
          "humidityPercent": Number((arr[4]).replace('-', '')),
          "wetBulbDepression": Number(arr[5]),
          "windDir": arr[6],
          "windSpeedMps":Number(((arr[7]).replace('-','') * 0.277777778).toFixed(0)),
          "windGustMps": Number((arr[8] * 0.277777778).toFixed(3)),
          "windSpeedKnotsKts": Number(arr[9]),
          "windGustKts": Number(arr[10]),
          "pressureHpa": Number(Number((arr[11]).replace('-', '')).toFixed(0)),
          "rainSince9AM": Number(arr[12]),
          "lowTempC": Number(arr[13]),
          "highTempC": Number(arr[14]),
          "dirWindComeFrom": arr[15],
          "highestWindGustFrom10Mps": (arr[16] * 0.277777778),
          "highestWindGustFrom10MKts": Number(arr[17])
        }
      });
          
      const array = [];
          
      for (let i = 0; i < cities.length; i++) {
        if (!cities[i])
          continue;
        const obj = {
          location: cities[i],
          weather: [weatherInfo[i]]
        }
        array.push(obj);
      }
      resolve(array);
      }
      catch (error) {
        console.log(error);
        reject(error);
      }
    });
}

let finalResult = []

let stats = {}
  Promise.mapSeries(endPoints,  getCityData)
  .then((citiesWeather) => {
    finalResult = [].concat.apply([],citiesWeather);
    // console.log(JSON.stringify(finalResult, null, 2))
    fs.writeFileSync(`./tmp/todo/australia.json`, JSON.stringify(finalResult, null, 2), 'utf8');
  return finalResult
  })
    
// const generateStats = Promise.mapSeries(endPoints, getCityData)
//   .then((citiesWeather) => {
//     finalResult = [].concat.apply([], citiesWeather);
//     return finalResult
//   })
//   .then(data => {
//     stats = {
//       timeStampRun: timeStamp,
//       countOfItems: data.length,
//       sumOfTempC: _.sumBy(data, loc => _.sumBy(loc.weather, w => w.tempC)),
//       sumOfWind: _.sumBy(data, loc => _.sumBy(loc.weather, w => w.windSpeedMps)),
//       sumOfPressure: _.sumBy(data, loc =>
//         _.sumBy(loc.weather, w => w.pressureHpa)
//       ),
//       sumOfHumidity: _.sumBy(data, loc => _.sumBy(loc.weather, w => w.humidityPercent)),
//       timeLastUpdate: data.map(record => record.weather[0].last_updated),
//       longLats: data.map(record => ({ lat: record.location.lat, lng: record.location.lng, alt: record.location.altM }))
//     }
//     fs.writeFileSync(
//         `./stats/stats_${stats.timeStampRun}.json`,
//         JSON.stringify(stats, null, 2),
//         "utf8"
//       );
//     return stats
//   })
      
//     module.exports = generateStats
    

