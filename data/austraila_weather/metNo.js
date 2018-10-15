const top1000Cities = require("./1000_cities.json");
const sleep = require("system-sleep");
const { parseString } = require("xml2js");
const request = require("sync-request");
const fs = require('fs')

function getWeatherFromMetno() {
  let data = [];
  let errorCount = 0;

  top1000Cities.forEach((city) => {

    const { name, lat, lng, alt } = city;
    const url = `https://api.met.no/weatherapi/locationforecastlts/1.3/?lat=${lat}&lon=${lng}&msl=${alt}`;

    try {
      const response = request("GET", url);

      sleep(2000);
      const xmlData = response.body;
      if (!xmlData) console.error("No XML data!");

      parseString(xmlData, (err, result) => {
        if (err) console.error(err.message);

        const fetchedWeatherData =
          result.weatherdata.product[0].time[0].location[0];
        const apiTime = result.weatherdata.product[0].time[0].$.from;
        const {
          temperature,
          dewpointTemperature,
          windSpeed,
          windDirection,
          cloudiness,
          fog,
          humidity,
          pressure,
          lowClouds,
          mediumClouds,
          highClouds
        } = fetchedWeatherData;
        const now = Math.floor(Date.now() / 1000);

        function getDataFrom(element) {
          return element[0].$;
        }

        data.push({
          location: city,
          weather: {
            timeStamp: now,
            sourceUpdateTime: Math.floor(new Date(apiTime) / 1000),
            temperatureC: Number(getDataFrom(temperature).value),
            dewpointTemperatureC: Number(
              getDataFrom(dewpointTemperature).value
            ),
            windSpeedMps: Number(getDataFrom(windSpeed).mps),
            windDirectionDeg: Number(getDataFrom(windDirection).deg),
            cloudsPercent: Number(getDataFrom(cloudiness).percent),
            forPercent: Number(getDataFrom(fog).percent),
            humidityPercent: Number(getDataFrom(humidity).value),
            pressureHPA: Number(getDataFrom(pressure).value),
            lowCloudsPercent: Number(getDataFrom(lowClouds).percent),
            mediumCloudsPercent: Number(getDataFrom(mediumClouds).percent),
            highCloudsPercent: Number(getDataFrom(highClouds).percent)
          }
        });

        const timeArgPrefix = process.argv[2];
        process.argv.length === 3
          ? fs.writeFileSync(
            `./tmpMetNo/todo/metno.${timeArgPrefix}.json`,
            JSON.stringify(data, null, 2)
          )
          : console.log(JSON.stringify(data, null, 2));
      });
    } catch (e) {
      errorCount++;
      console.error(`\nError: ${e.message}, Occured while fetching ${name}`);
      console.error(`Total errors: ${errorCount}\n`);
    }
    
  });
}
getWeatherFromMetno();