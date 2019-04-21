const axios = require("axios");
const cheerio = require("cheerio");
const moment = require("moment");
const { sleep } = require("sleep");
const fs = require("fs");

const citiesAndCoords = require("./sources/south-korean-cities-coordinates.json");

(async function main() {
  const url = "http://web.kma.go.kr/eng/weather/forecast/current_korea.jsp";
  const response = await axios.get(url);
  const html = response.data;
  const $ = cheerio.load(html);

  const rows = $(".table_midterm > tbody > tr").toArray();
  let result = [];

  rows.forEach(row => {
    const data = n => row.children[n].children[0].data;

    try {
      const city = data(1);
      const description = data(3);
      const visibilityKM = data(5);
      const cloudsPercent = data(7) * 10;
      const tempratureC = data(9);
      const windDir = data(11);
      const windSpeedMS = data(13);
      const humidityPercent = data(15);
      const pressureHPA = data(19);
      const cityDetails = citiesAndCoords.find(k => k.name === city);

      result.push({
        location: cityDetails,
        weather: {
          timeStamp: moment().format("MMMM Do YYYY, h:mm:ss a"),
          timeKorea: moment()
            .utcOffset(9)
            .format("MMMM Do YYYY, h:mm:ss a"),
          tempratureC,
          cloudsPercent,
          humidityPercent,
          windSpeedMS,
          windDir,
          pressureHPA,
          visibilityKM,
          description
        }
      });

      fs.writeFileSync(
        "./sources/weather.json",
        JSON.stringify(result, null, 2),
        "utf8"
      );
      console.log(`✓ temprature in ${city} is ${tempratureC}`);
      sleep(2);
    } catch (e) {
      console.log(`\n✗ ${e.message}\n`);
    }
  });
})();
