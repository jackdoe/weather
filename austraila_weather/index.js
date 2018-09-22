const cheerio = require('cheerio');
const axios = require('axios');

const endPoints = [MELBOURNE_URL = "http://www.bom.gov.au/vic/observations/melbourne.shtml?ref=dropdown",
SYDNEY_URL = "http://www.bom.gov.au/nsw/observations/sydney.shtml?ref=dropdown",
BRISBANE_URL = "http://www.bom.gov.au/qld/observations/brisbane.shtml?ref=dropdown",
PERTH_URL = "http://www.bom.gov.au/wa/observations/perth.shtml?ref=dropdown",
ADELAIDE_URL = "http://www.bom.gov.au/sa/observations/adelaide.shtml?ref=dropdown",
HOBART_URL = "http://www.bom.gov.au/tas/observations/hobart.shtml?ref=dropdown",
CANBERRA_URL = "http://www.bom.gov.au/act/observations/canberra.shtml?ref=dropdown",
DARWIN_URL = "http://www.bom.gov.au/nt/observations/darwin.shtml?ref=dropdown"
]

const top1000Cities = require('./1000_cities.json');

function getCityData(areaUrl) {
  return new Promise(async (resolve, reject) => {
    try {
      const urlResponse = await axios.get(areaUrl);
      const object = cheerio.load(urlResponse.data);

      const cities = object('tr > th > a')
        .toArray()
        .map(elem => elem.children[0].data)
        .map(city => {
          const cityCoords = top1000Cities.find(c => new RegExp(`(${c.name})\\b.*$`).test(city));
          if (!cityCoords) return;
          return {
            name: city,
            lat: cityCoords.lat,
            lng: cityCoords.lng
          };
        })

      const data = object('tbody > tr')
        .toArray()
        .map(row => row.children
          .filter(cell => cell.name === 'td' && cell.type === 'tag')
          .map(td => td.children[0] && td.children[0].data));

      const weatherInfo = data.map(arr => {
        return {
          "Date_TimeEST": arr[0],
          "TempC": Number(arr[1]),
          "AppTempC": Number(arr[2]),
          "DewPointC": Number(arr[3]),
          "Relative_humidity": Number(arr[4]),
          "WetBulbDepression": Number(arr[5]),
          "WindDir": arr[6],
          "WindSpeedMps": (arr[7] * 0.277777778),
          "WindGustMps": (arr[8] * 0.277777778),
          "WindSpeedKnotsKts": Number(arr[9]),
          "WindGustKts": Number(arr[10]),
          "PressureHPa": Number(arr[11]),
          "RainSince9AM": Number(arr[12]),
          "LowTempC": Number(arr[13]),
          "HighTempC": Number(arr[14]),
          "DirWindComeFrom": arr[15],
          "HighestWindGustFrom10Mps": (arr[16] * 0.277777778),
          "HighestWindGustFrom10MKts": Number(arr[17])
        }
      });

      const array = [];

      for (i = 0; i < data.length; i++) {
        if (!cities[i])
          continue;
        const obj = {
          location: cities[i],
          weather: [weatherInfo[i]]
        }
        array.push(obj);
      }
      resolve(JSON.stringify(array));
    }
    catch (error) {
      console.log(error);
      reject(error);
    }
  });
}

Promise.all(endPoints.map(url => getCityData(url)))
  .then((citiesWeather) => {
    const finalResult = [].concat.apply([], citiesWeather);
    console.log(finalResult)
  });
