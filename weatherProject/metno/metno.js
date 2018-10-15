'use strict';

const parseString = require('xml2js').parseString;
const axios = require('axios');
const { promisify } = require('util');
const parseStringWithPromise = promisify(parseString);
const cities = require('./cities.json');
const metNoExample = "https://api.met.no/weatherapi/locationforecast/1.9/?lat=";

async function getMetnoTemp(lat, lng, alt) {
    try {
        const response = await axios.get(`${metNoExample}${lat}&lon=${lng}&msl=${alt}`);
        const xml = await parseStringWithPromise(response.data);
        const timeStampFrom = (Date.parse(xml.weatherdata.product[0].time[0].$.from)) / 1000
        const timeStampTo = (Date.parse(xml.weatherdata.product[0].time[0].$.to)) / 1000
        const temp = [
            {
                lat: lat,
                lng: lng,
                alt: alt
            },
            {
                from: timeStampFrom,
                to: timeStampTo,
                symbol: xml.weatherdata.product[0].time[1].location[0].symbol[0].$.id,
                temperature: parseFloat(xml.weatherdata.product[0].time[0].location[0].temperature[0].$.value),
                windSpeed: parseFloat(xml.weatherdata.product[0].time[0].location[0].windSpeed[0].$.mps),
                humidity: parseFloat(xml.weatherdata.product[0].time[0].location[0].humidity[0].$.value),
                pressure: parseFloat(xml.weatherdata.product[0].time[0].location[0].pressure[0].$.value),
                windDirection: xml.weatherdata.product[0].time[0].location[0].windDirection[0].$.name,
                windDirectionDeg: parseFloat(xml.weatherdata.product[0].time[0].location[0].windDirection[0].$.deg),
                cloudiness: parseFloat(xml.weatherdata.product[0].time[0].location[0].cloudiness[0].$.percent),
                fog: parseFloat(xml.weatherdata.product[0].time[0].location[0].fog[0].$.percent),
                lowClouds: parseFloat(xml.weatherdata.product[0].time[0].location[0].lowClouds[0].$.percent),
                mediumClouds: parseFloat(xml.weatherdata.product[0].time[0].location[0].mediumClouds[0].$.percent),
                highClouds: parseFloat(xml.weatherdata.product[0].time[0].location[0].highClouds[0].$.percent),
                dewPointTemperature: parseFloat(xml.weatherdata.product[0].time[0].location[0].dewpointTemperature[0].$.value),
                updatedTimeStamp: Math.floor(Date.now() / 1000),

            }]
        return temp;
    } catch (error) {
        console.error(error);
    }
};

async function main() {
    let array = [];

    for (let i = 0; i < cities.length; i++) {
        let result = await getMetnoTemp(cities[i].lat, cities[i].lng, cities[i].alt)
            .then(function (result) {
                array.push(
                    {
                        location: result[0],
                        weather: [result[1]]
                    }
                );
                if (i == (cities.length - 1)) {
                    console.log(JSON.stringify(array, null, 2))
                }
            })
    }
}
main()
