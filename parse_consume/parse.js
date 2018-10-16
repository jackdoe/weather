const axios = require("axios");
const cheerio = require("cheerio");
const moment = require("moment");
const { sleep } = require("sleep");
const fs = require("fs");

const citiesAndCoords = require("./sources/south-korean-cities-coordinates.json");

async function fetchKoreanAPI() {
  const url = "http://web.kma.go.kr/eng/weather/forecast/current_korea.jsp";
  const response = await axios.get(url);
  const html = response.data;

  const $ = cheerio.load(html);

  const rows = $(".table_midterm > tbody > tr").toArray();
  let result = [];
  let stats = {};
  rows.forEach(row => {
    try {
      const getDataAt = n => row.children[n].children[0].data;

      const cityName = getDataAt(1);
      const description = getDataAt(3);
      const visibilityKM = Number(getDataAt(5));
      const cloudsPercent = Number(getDataAt(7) * 10);
      const temperatureC = Number(getDataAt(9));
      const windDir = getDataAt(11);
      const windSpeedMS = Number(getDataAt(13));
      const humidityPercent = Number(getDataAt(15));
      const pressureHPA = Number(getDataAt(19));
      const cityDetails = citiesAndCoords.find(city => city.name === cityName);
      const sourceUpdateTime = $(".tab_cap").text();
      const now = Math.floor(Date.now() / 1000); // new Date(now * 1000).toUTCString()

      result.push({
        location: cityDetails,
        weather: {
          timeStamp: now,
          timeKorea: moment()
            .utcOffset(9)
            .format("MMMM Do YYYY, h:mm:ss a"),
          sourceUpdateTime,
          temperatureC,
          cloudsPercent,
          humidityPercent,
          windSpeedMS,
          windDir,
          pressureHPA,
          visibilityKM,
          description
        }
      });

      const { lat, lng } = cityDetails;

      const getSumOf = (elm, val) =>
        elm ? Number((elm + val).toFixed(0)) : val;

      stats = {
        timeIssued: now,
        apiName: "Korea Meteorological Administration",
        totalItems: result.length,
        sumOftempC: getSumOf(stats.sumOftempC, temperatureC),
        sumOfWindMS: getSumOf(stats.sumOfWindMS, windSpeedMS),
        sumOfPressureHPA: getSumOf(stats.sumOfPressureHPA, pressureHPA),
        sumOfHumidityPercent: getSumOf(
          stats.sumOfHumidityPercent,
          humidityPercent
        ),
        timeLastUpdate: sourceUpdateTime,
        latLng: stats.latLng ? [...stats.latLng, { lat, lng }] : [{ lat, lng }]
      };
      sleep(2);
    } catch (e) {
      console.error(`\n✗ ${e.message}\n`);
    }
  });

  if (!stats || !result) return;

  const datePrefix = process.argv[2];

  if (process.argv.length === 2) {
    console.log(JSON.stringify(result, null, 2));
  } else if (datePrefix) {
    fs.writeFileSync(
      `./tmp/todo/${stats.apiName}.${datePrefix}.stats.json`,
      JSON.stringify(stats, null, 2)
    );
  }
}

fetchKoreanAPI();

module.exports = fetchKoreanAPI;

/*
node parse.js > ./tmp/korea.json && mv ./tmp/korea.json ./tmp/todo/korea.$(date +%s).json
*/
