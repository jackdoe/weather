
const _ = require('lodash');
const polandWether = require('./polandWeather.json');
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

polandWether.forEach(async record => {
  const lat = record.location.lat;
  const lng = record.location.lng;
  const url = `https://api.met.no/weatherapi/locationforecastlts/1.3/?lat=${lat}&lon=${lng}`;
  try {
    const response = await axios.get(url);
    const html = response.data;
  
    const $ = cheerio.load(html);
    const xmlMetno = $('.pointData > time > location > temperature').toArray();
    const tempFromMetno = xmlMetno
      .filter((child, i) => {
        if (i > 71) return;
        return child;
      })
      .map(item => (Number(item.attribs.value)));
    
      const sumTempFromMetno = Number(_.sum(tempFromMetno).toFixed(0));
    const sumOfTempDiffWithMetno = sumTempFromMetno - stats.sumOfTempC; //TODO : get the sum of all the locations 
    
    } catch (e) {
      console.log(e.message);
    }
  })
  
  debugger;
  
const stats = {
  timeStampRun: Date.now(),
  countOfItems: polandWether.length * _.sumBy(polandWether, loc => loc.weather.length),
  sumOfTempC: _.sumBy(polandWether, loc => _.sumBy(loc.weather, w => w.tempC)),
  sumOfWind: _.sumBy(polandWether, loc => _.sumBy(loc.weather, w => w.windMps)),
  sumOfPressure: _.sumBy(polandWether, loc =>
    _.sumBy(loc.weather, w => w.pressureHpa)
  ),
  sumOfHumidity: _.sumBy(polandWether, loc => _.sumBy(loc.weather, w => w.humidity)),
  timeLastUpdate: polandWether.map(record => record.weather[0].lastUpdate),
  longLats: polandWether.map(record => ({ lat: record.location.lat, lng: record.location.lng }))
}
fs.writeFileSync(
  `./stats_${stats.timeStampRun}.json`,
  JSON.stringify(stats, null, 2),
  "utf8"
);
console.log(stats)
