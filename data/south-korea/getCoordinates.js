const axios = require("axios");
const { sleep } = require("sleep");

async function getCoordinates(cityName) {
  const KEY = "3qrtTDxHwEEnR3z32ztw1tSZHVBcnK5m";
  const API_URL = `http://www.mapquestapi.com/geocoding/v1/address?key=${KEY}&location=${cityName},KOR`;
  return axios
    .get(API_URL)
    .then(response => response.data.results[0].locations[0].latLng);
}

module.exports = getCoordinates;
