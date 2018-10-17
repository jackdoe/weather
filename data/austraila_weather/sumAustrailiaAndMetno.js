
const _ = require('lodash');
const australiaWeather = require('./australiaWeather.json');
const fs = require('fs');

  
  const stats = {
    timeStampRun: Date.now(),
    countOfItems: australiaWeather.length * _.sumBy(australiaWeather, loc => loc.weather.length),
    sumOfTempC: _.sumBy(australiaWeather, loc => _.sumBy(loc.weather, w => w.tempC)),
    sumOfWind: _.sumBy(australiaWeather, loc => _.sumBy(loc.weather, w => w.windSpeedMps)),
    sumOfPressure: _.sumBy(australiaWeather, loc =>
      _.sumBy(loc.weather, w => w.pressureHpa)
    ),
    sumOfHumidity: _.sumBy(australiaWeather, loc => _.sumBy(loc.weather, w => w.humidityPercent)),
    timeLastUpdate: australiaWeather.map(record => record.weather[0].last_updated),
    longLats: australiaWeather.map(record => ({ lat: record.location.lat, lng: record.location.lng }))
  }
  fs.writeFileSync(
    `./stats_${stats.timeStampRun}.json`,
    JSON.stringify(stats, null, 2),
    "utf8"
  );
  console.log(stats)

