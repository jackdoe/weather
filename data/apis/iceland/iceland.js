'use strict';

const cheerio = require('cheerio');
const axios = require('axios');
const Windrose = require('windrose');
const { readJSONFile } = require('./fileOperations');

const ICELAND_URL = 'https://icelandmonitor.mbl.is/weather/forecasts/';
const CITIES_LOCATION_FILE = './icelandCities.json';

async function main() {

  try {

    const response = await axios.get(ICELAND_URL);

    const cheerioObject = cheerio.load(response.data);
    const cities = cheerioObject("h3[id^='station']")
      .toArray().map(th => th.children[0].data);

    const updated = cheerioObject("p[class^= 'text-forecast'] small")
      .toArray().map(elem => elem.children[2].data);
    const updatedTimestamp = Date.parse(updated[0]) / 1000;

    const dayPerCity = cheerioObject("div[class^= 'd--maincol'] ul").find('li').length / cities.length;
    if (dayPerCity === 0 || dayPerCity === Infinity)
      throw new Error('error fetching cities or days count');

    const symbolArray = getData(cheerioObject, 'condition');
    const tempCArray = getData(cheerioObject, 'temp');
    const windMpsArray = getData(cheerioObject, 'wind');
    const windDirectionArray = getData(cheerioObject, 'windDirection');
    const rainMmArray = getData(cheerioObject, 'precipitation');

    const citiesLocation = await readJSONFile(CITIES_LOCATION_FILE);

    const citiesObj = cities.map(city => {
      const cityLocation = citiesLocation.find(elem => elem.name === city);
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
          updatedTimestamp,
          fromHour: timeStamp(i % dayPerCity),
          toHour: timeStamp((i % dayPerCity) + 1),
          symbol: symbolArray[i],
          temperatureC: tempCArray[i],
          windSpeedMps: windMpsArray[i],
          windDirectionDeg: windDirectionArray[i],
          rainPrecipitationMm: rainMmArray[i]
        });
      }

      city.weather = weatherArray;

    });

    console.log(JSON.stringify(citiesObj, null, 2));

  } catch (error) {
    console.error(error.message);
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

  } else if (className === 'windDirection') {
    values = html("div[class^='d--maincol'] span[class^=wind] > span[class=direction]")
      .toArray().map(elem => Windrose.getDegrees(elem.children[0].data).value);
    return values;
  }
  else {
    values = html("div[class^='d--maincol'] span[class^=" + className + "] > span[class=value]")
      .toArray().map(elem => Number(elem.children[0].data));
    if (values.length === 0 || values.some(isNaN))
      throw new Error('error fetching ' + className + ' values');
    return values;
  }

}

function timeStamp(addedDays) {

  const now = new Date();
  const timestamp = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + addedDays);
  return timestamp / 1000;

}

main();