const cheerio = require('cheerio');
const axios = require('axios');
const moment = require('moment');
const Promise = require('bluebird');
const australiaLocations = require("./australiaLocations");
const fs = require("fs");

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
            new RegExp(`${c.name}\\b.*`,"i").test(city)
          );
          if (!cityCoords) return;
          return {
            name: city,
            lat: cityCoords.lat,
            lng: cityCoords.lng,
            altM : cityCoords.altM
          };
        })

      const data = object('tbody > tr')
        .toArray()
        .map(row => row.children
          .filter(cell => cell.name === 'td' && cell.type === 'tag')
          .map(td => td.children[0] && td.children[0].data));
          const weatherInfo = data.map(arr => {
            return {
              "time_stamp": timeStamp,
              "last_updated": moment(arr[0],'DD/hh:mma').unix(),
              "tempC": Number(arr[1]),
              "appTempC": Number(arr[2]),
              "dewPointC": Number(arr[3]),
              "humidityPercent": Number(arr[4]),
              "wetBulbDepression": Number(arr[5]),
              "windDir": arr[6],
              "windSpeedMps": (arr[7] * 0.277777778),
              "windGustMps": (arr[8] * 0.277777778),
              "windSpeedKnotsKts": Number(arr[9]),
              "windGustKts": Number(arr[10]),
              "pressureHpa": Number(arr[11]),
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
    
    Promise.mapSeries(endPoints,  getCityData)
      .then((citiesWeather) => {
          const finalResult = [].concat.apply([],citiesWeather);
        console.log(JSON.stringify(finalResult, null, 2))
        fs.writeFileSync(`./australiaWeather.json`, JSON.stringify(finalResult, null, 2), 'utf8');
  })

// for i in { 0..4 }; do node index.js; sleep 15; done
