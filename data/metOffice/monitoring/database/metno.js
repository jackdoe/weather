const axios = require("axios");
const mysql = require("mysql");
const top1000Cities = require("./topCities/top-1000-cities.json");
const { sleep } = require("sleep");
const { parseString } = require("xml2js");

top1000Cities.forEach(async city => {
  const { name, lat, lng, alt } = city;
  const url = `https://api.met.no/weatherapi/locationforecastlts/1.3/?lat=${lat}&lon=${lng}&msl=${alt}`;
  try {
    const response = await axios.get(url);
    const xmlData = response.data;
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

      console.log(
        JSON.stringify(
          [
            {
              location: {
                name: name,
                lat: lat,
                lng: lng,
                alt: alt
              },
              weather: {
                timeStamp: now,
                sourceUpdateTime: Math.floor(new Date(apiTime) / 1000),
                temperatureC: Number(getDataFrom(temperature).value),
                dewpointTemperatureC: Number(
                  getDataFrom(dewpointTemperature).value
                ),
                windSpeedMPS: Number(getDataFrom(windSpeed).mps),
                windDirectionDeg: Number(getDataFrom(windDirection).deg),
                cloudsPercent: Number(getDataFrom(cloudiness).percent),
                forPercent: Number(getDataFrom(fog).percent),
                humidityPercent: Number(getDataFrom(humidity).value),
                pressureHPA: Number(getDataFrom(pressure).value),
                lowCloudsPercent: Number(getDataFrom(lowClouds).percent),
                mediumCloudsPercent: Number(getDataFrom(mediumClouds).percent),
                highCloudsPercent: Number(getDataFrom(highClouds).percent)
              }
            }
          ],
          null,
          2
        )
      );
      sleep(2);
    });
  } catch (e) {
    console.error(e.message);
    sleep(2);
  }
});
