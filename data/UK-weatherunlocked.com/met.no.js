const fs = require("fs");
const convert = require("xml-js");
const request = require("sync-request");
const sleep = require("system-sleep");

const cities = fs.readFileSync("GBcities.json", "utf-8");
const cityObj = Array.from(JSON.parse(cities));
const metNoFinalArray = [];
const geohash = require("ngeohash");

const writeFile = data =>
  fs.writeFileSync(
    `./requestOutputs/weatherOutputMetno.json`,
    JSON.stringify(data, null, 2)
  );

for (const location of cityObj) {
  try {
    const response = request(
      "GET",
      `https://api.met.no/weatherapi/locationforecast/1.9/?lat=${
        location.lat
      }&lon=${location.lng}&msl=${location.altitude}`
    );
    sleep(2000);

    const data = convert.xml2json(response.body, { compact: true, spaces: 4 });

    const geohash3 = geohash.encode(
      location.lng,
      location.lat,
      (precision = 3)
    );
    const geohash5 = geohash.encode(
      location.lng,
      location.lat,
      (precision = 5)
    );

    const dataObj = JSON.parse(data);

    const weatherObj = dataObj.weatherdata.product.time[0].location;

    const latitude = parseFloat(weatherObj._attributes.latitude);
    const longitude = parseFloat(weatherObj._attributes.longitude);
    const symbol =
      dataObj.weatherdata.product.time[1].location.symbol._attributes.id;
    const fromHour = dataObj.weatherdata.product.time[0]._attributes.from;
    const altitude = parseFloat(weatherObj._attributes.altitude);
    const fogPercent = parseFloat(weatherObj.fog._attributes.percent);
    const pressureHpa = parseFloat(weatherObj.pressure._attributes.value);
    const cloudinessPercent = parseFloat(
      weatherObj.cloudiness._attributes.percent
    );
    const windDirectionDeg = parseFloat(
      weatherObj.windDirection._attributes.deg
    );

    const dewpointTemperatureC = parseFloat(
      weatherObj.dewpointTemperature._attributes.value
    );

    const humidityPercent = parseFloat(weatherObj.humidity._attributes.value);
    const windSpeedMps = parseFloat(weatherObj.windSpeed._attributes.mps);
    const temperatureC = parseFloat(weatherObj.temperature._attributes.value);
    const lowCloudsPercent = parseFloat(
      weatherObj.lowClouds._attributes.percent
    );

    const mediumCloudsPercent = parseFloat(
      weatherObj.mediumClouds._attributes.percent
    );

    const highCloudsPercent = parseFloat(
      weatherObj.highClouds._attributes.percent
    );

    const metNo = {
      location: {
        longitude,
        latitude,
        altitude,
        city: location.name
      },
      weather: [
        {
          sourceApi: `https://api.met.no/`,
          geohash3,
          geohash5,
          fromHour,
          temperatureC,
          dewpointTemperatureC,
          symbol,
          humidityPercent,
          pressureHpa,
          windDirectionDeg,
          windSpeedMps,
          cloudinessPercent,
          lowCloudsPercent,
          mediumCloudsPercent,
          highCloudsPercent,
          fogPercent
        }
      ]
    };

    metNoFinalArray.push(metNo);
    writeFile(metNoFinalArray);
    console.log(JSON.stringify( metNoFinalArray, null, 2));
  } catch (error) {
    console.error(error); 
  }
}
