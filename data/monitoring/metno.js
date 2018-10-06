const parseString = require('xml2js').parseString;
const axios = require('axios');
const sleep = require('sleep');
const { readJSONFile } = require('./fileOperations');
const { promisify } = require('util');

const USA_CITIES_FILE = '../usa/usaCities.json';
const WEATHER_FILE = '../usa/usaWeather.json';
const METNO_API_URL = 'https://api.met.no/weatherapi/locationforecastlts/1.3/?lat=';

const parseStringWithPromise = promisify(parseString);

async function getTempDiffWithMetno() {

  try {
    const usaCitiesList = await readJSONFile(USA_CITIES_FILE);
    const weatherData = await readJSONFile(WEATHER_FILE);
    const shuffled = usaCitiesList.slice(0, 10).sort(() => .5 - Math.random());// shuffle  
    const random5Cities = shuffled.slice(0, 5); //get sub-array of first n elements AFTER shuffle
    let sumMetnoTemp = 0;
    let sumAPITemp = 0;

    for (let i = 0; i < random5Cities.length; i++) {
      let city = random5Cities[i];
      sumMetnoTemp += await getMetnoTemp(city.lat, city.lng, city.alt);
      obj = weatherData.find(item =>
        item.location.lat === city.lat && item.location.lng === city.lng);
      if (obj)
        sumAPITemp += obj.weather[0].tempC;
      sleep.sleep(2);
    }

    return sumAPITemp - sumMetnoTemp;

  } catch (error) {
    console.log(error);
  }

}

async function getMetnoTemp(lat, lng, alt) {

  try {

    const response = await axios.get(`${METNO_API_URL}${lat}&lon=${lng}&msl=${alt}`);
    const xml = await parseStringWithPromise(response.data);
    const temp = parseFloat(
      xml.weatherdata.product[0].time[0].location[0].temperature[0].$.value);
    return temp;

  } catch (error) {
    console.log(error);
  }

}

module.exports = {
  getTempDiffWithMetno,
};