const { readJSONFile, writeJSONFile } = require('./fileOperations');

const WEATHER_FILE = '../usa/usaWeather.json';
const STATE_FILE = './charts/src/states/state.json'


async function main() {
  try {

    const weatherData = await readJSONFile(WEATHER_FILE);
    const stateArray = await readJSONFile(STATE_FILE);
    const countOfItems = weatherData.reduce((acc, city) => acc + city.weather.length, 0);
    let sumOfTempC = 0;
    let sumOfWind = 0;
    weatherData.forEach(city => {
      sumOfTempC += city.weather.reduce((acc, item) => acc + item.tempC, 0);
      sumOfWind += city.weather.reduce((acc, item) => acc + item.windMps, 0);
    });
    const latLng = weatherData.map(city => [city.location.lat, city.location.lng]);

    const state = {
      timeStampRun: Math.floor(Date.now() / 1000),
      nameOfApi: 'usaWeather',
      countOfItems,
      sumOfTempC,
      sumOfWind,
      lastUpdate: weatherData[0].weather[0].updatedTimestamp,
      latLng
    }
    stateArray.push(state);

    console.log(JSON.stringify(stateArray, null, 2))
    await writeJSONFile(`./charts/src/states/state${state.timeStampRun}.json`, state);
    await writeJSONFile(STATE_FILE, stateArray);

  } catch (error) {
    console.log(error)
  }

}


main();