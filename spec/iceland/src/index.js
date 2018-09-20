const cheerio = require('cheerio');
const axios = require('axios');
const { readJSONFile } = require('./fileOperations');

const ICELAND_URL = 'https://icelandmonitor.mbl.is/weather/forecasts/';

async function main() {

  try {

    const response = await axios.get(ICELAND_URL);

    const cheerioObject = cheerio.load(response.data);
    const cities = cheerioObject("h3[id^='station']")
      .toArray().map(th => th.children[0].data);

    const dayPerCity = cheerioObject("div[class^= 'd--maincol'] ul").find('li').length / cities.length;

    const tempCArray = getData(cheerioObject, 'temp');
    const windMpsArray = getData(cheerioObject, 'wind');
    const rainMmArray = getData(cheerioObject, 'precipitation');
    // temps, winds and rain arrays have 10 cities * 6 days = 60 weather value 

    const citiesLocation = await readJSONFile('./data/icelandCities.json');

    let JSONObj = cities.map(city => {
      cityLocation = citiesLocation.find(elem => elem.name === city);
      return {
        location:
        {
          lat: cityLocation.lat,
          lng: cityLocation.lng
        }
      };
    });

    JSONObj.forEach((city, index) => {
      let weatherArray = [];
      let start = index * dayPerCity;
      //every city has weather array which has weather information for six days
      for (let i = start; i < start + dayPerCity; i++) {
        weatherArray.push({
          timeStamp: timeStamp(i % dayPerCity),
          tempC: tempCArray[i],
          windSpeedMps: windMpsArray[i],
          rainPrecipitationMm: rainMmArray[i]
        });
      }
      city.weather = weatherArray;
    });

    console.log(JSON.stringify(JSONObj, null, 2));

  } catch (error) {

    console.log(error);

  }

}

function getData(html, className) {

  const data = html("div[class^='d--maincol'] span[class^=" + className + "] > span[class=value]")
    .toArray().map(elem => elem.children[0].data);
  return data;

}

function timeStamp(addedDays) {

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + addedDays);
  const timestamp = startOfDay / 1000;
  return timestamp

}


main();