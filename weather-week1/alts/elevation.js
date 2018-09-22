const axios = require("axios");
const cities = require("./top-1000-cities");
const sleep = require("sleep");
const fs = require("fs");

let final = [];
cities.map(async (city) => {
  const { lat, lng } = city;
  const cityName = city.name;
  const currentCityAPI = `https://elevation-api.io/api/elevation?points=(${lat},${lng})`;
  try {
    const response = await axios(currentCityAPI);
    const data = response.data;
    const alt = data.elevations[0].elevation;
    console.log(`${cityName} is ${alt}m above sea level`);
    storeAlt({ ...city, alt });
  } catch (e) {
    console.log(`error with ${cityName}, ${e.message}`);
  }
  sleep.sleep(2);
});

const storeAlt = val => {
  final.push(val);
  return fs.writeFileSync(
    "myCities2.json",
    JSON.stringify(final, null, "\t"),
    "utf8"
  );
};
