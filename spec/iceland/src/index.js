const cheerio = require('cheerio');
const $ = require('cheerio');
const axios = require('axios');
const { readJSONFile, writeJSONFile } = require('./fileOperations');

const ICELAND_URL = 'https://icelandmonitor.mbl.is/weather/forecasts/';
const CITIES_LOCATION_FILE = './data/icelandCities.json';
const CITIES_WEATHER_FILE = './data/icelandWeather.json'

async function main() {

  try {

    const response = await axios.get(ICELAND_URL);

    const cheerioObject = cheerio.load(response.data);
    const cities = cheerioObject("h3[id^='station']")
      .toArray().map(th => th.children[0].data);

    const dayPerCity = cheerioObject("div[class^= 'd--maincol'] ul").find('li').length / cities.length;
    if (dayPerCity === 0 || dayPerCity === Infinity)
      throw new Error('error fetching cities or days count');

    const conditionArray = getData(cheerioObject, 'condition');
    const tempCArray = getData(cheerioObject, 'temp');
    const windMpsArray = getData(cheerioObject, 'wind');
    const rainMmArray = getData(cheerioObject, 'precipitation');

    const citiesLocation = await readJSONFile(CITIES_LOCATION_FILE);

    const citiesObj = cities.map(city => {
      cityLocation = citiesLocation.find(elem => elem.name === city);
      return {
        location:
        {
          lat: cityLocation.lat,
          lng: cityLocation.lng
        }
      };
    });

    citiesObj.forEach((city, index) => {

      const weatherArray = [];
      const start = index * dayPerCity;

      for (let i = start; i < start + dayPerCity; i++) {
        weatherArray.push({
          timeStamp: timeStamp(i % dayPerCity),
          condition: conditionArray[i],
          tempC: tempCArray[i],
          windSpeedMps: windMpsArray[i],
          rainPrecipitationMm: rainMmArray[i]
        });
      }

      city.weather = weatherArray;

    });

    await writeJSONFile(CITIES_WEATHER_FILE, citiesObj);
    console.log(JSON.stringify(citiesObj, null, 2));

  } catch (error) {

    console.log(error.message);

  }

}

function getData(html, className) {

  let values = [];

  if (className === 'condition') {

    html("div[class^='d--maincol'] p[class^=fc-" + className + "] img").each((index, elem) =>
      values.push(cheerio(elem).attr('alt')));

    if (values.length === 0)
      throw new Error('error fetching condition values');

    return values;

  }

  values = html("div[class^='d--maincol'] span[class^=" + className + "] > span[class=value]")
    .toArray().map(elem => Number(elem.children[0].data));

  if (values.length === 0 || values.some(isNaN))
    throw new Error('error fetching ' + className + ' values');

  return values;

}

function timeStamp(addedDays) {

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + addedDays);
  const timestamp = startOfDay / 1000;
  return timestamp

}

main();