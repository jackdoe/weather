'usa strict';

const { readJSONFile, writeJSONFile } = require('./fileOperations');
const { getTempDiffWithMetno } = require('./metno.js');

const WEATHER_FILE = '../usa/usaWeather.json';
const STATES_DIR = './states/';

async function main() {
  try {

    const weatherData = await readJSONFile(WEATHER_FILE);

    const countOfItems = weatherData.reduce((acc, city) => acc + city.weather.length, 0);
    let sumOfTempC = 0;
    let sumOfWind = 0;
    weatherData.forEach(city => {
      sumOfTempC += city.weather.reduce((acc, item) => acc + item.tempC, 0);
      sumOfWind += city.weather.reduce((acc, item) => acc + item.windMps, 0);
    });
    const latLng = weatherData.map(city => [city.location.lat, city.location.lng]);

    const sumOfTempCDiffWithMetno = await getTempDiffWithMetno();

    const state = {
      timeStampRun: Math.floor(Date.now() / 1000),
      nameOfApi: 'usaWeather',
      countOfItems,
      sumOfTempC: +sumOfTempC.toFixed(2),
      sumOfWind: +sumOfWind.toFixed(2),
      lastUpdate: weatherData[0].weather[0].updatedTimestamp,
      latLng,
      sumOfTempCDiffWithMetno: +sumOfTempCDiffWithMetno.toFixed(2)
    }

    await writeJSONFile(`${STATES_DIR}state${state.timeStampRun}.json`, state);

  } catch (error) {
    console.log(error)
  }

}


main();