const cheerio = require('cheerio');
const axios = require('axios');
const polandLocations = require('./polandLocations');
const Promise = require('bluebird');
const moment = require('moment');
const fs = require("fs");

const endPoints = [
  "http://www.meteoprog.pl/en/meteograms/Bialystok",
  "http://www.meteoprog.pl/en/meteograms/Bydgosch",
  "http://www.meteoprog.pl/en/meteograms/Gdansk/",
  "http://www.meteoprog.pl/en/meteograms/Gorzowwielkopolski/",
  "http://www.meteoprog.pl/en/meteograms/Katowice",
  "http://www.meteoprog.pl/en/meteograms/Keltse",
  "http://www.meteoprog.pl/en/meteograms/Krakow/",
  "http://www.meteoprog.pl/en/meteograms/Lublin/",
  "http://www.meteoprog.pl/en/meteograms/Lodz/",
  "http://www.meteoprog.pl/en/meteograms/Olsztyn/",
  "http://www.meteoprog.pl/en/meteograms/Opole/",
  "http://www.meteoprog.pl/en/meteograms/Poznan/",
  "http://www.meteoprog.pl/en/meteograms/Rzeszow/",
  "http://www.meteoprog.pl/en/meteograms/Szhzecin/",
  "http://www.meteoprog.pl/en/meteograms/Warszawa/",
  "http://www.meteoprog.pl/en/meteograms/Wroclaw/"
];

function extractNumberOnly(str) {
  return str && Number(str.replace(/[^\d.+-]+/g, ''));
}

function getCityData(areaUrl) {
  return new Promise(async (resolve, reject) => {
    try {
      const urlResponse = await axios.get(areaUrl);
      const object = cheerio.load(urlResponse.data);
      const timeDomElement = object('.actualdayWrapper > .copyWeather')
        .text().replace(/[^\d:+-]+/g, '');
      const  lastUpdate = moment(timeDomElement, 'hh:mm:ss').unix();
      debugger;
      const data = object("table > tbody > tr")
        .toArray()
        .map((row) => {
          return row.children
            .filter(cell => cell.name === 'td' && cell.type === 'tag')
            .map((td, i) => {
              if (i !== 1 && i !== 6) return td.children[0].data;
              return td.children[1].firstChild.data;
            });
        }).filter(r => r.length === 7);
      
      return resolve( data.map(arr => {
        return {
          lastUpdate,
          "time": moment(arr[0], 'hh: mm' ).unix(),
          "tempC": extractNumberOnly(arr[1]),
          "feelsLikeC": extractNumberOnly(arr[2]),
          "precipitationMm": extractNumberOnly(arr[3]),
          "pressureHpa": Number((extractNumberOnly(arr[4]) * 1.3332239).toFixed(0)),
          "humidity": extractNumberOnly(arr[5]),
          "windMps": extractNumberOnly(arr[6])
        }
      }));
    }
    catch (error){
      console.log(error);
      reject(error);
    }
  });
}

Promise.mapSeries(endPoints, getCityData)
  .then((citiesWeather) => {
    const finalResult = polandLocations.map((location, i) => ({ location, weather: citiesWeather[i] }));
    console.log(JSON.stringify(finalResult, null, 2))
    fs.writeFileSync(`./polandWeather.json`, JSON.stringify(finalResult, null, 2), "utf8");
  });

