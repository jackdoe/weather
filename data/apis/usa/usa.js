'use strict';

const axios = require('axios');
const sleep = require('sleep');
const { readJSONFile } = require('./fileOperations');
const config = require('./config');

const SLEEP_SECOND = config.delayBetweenRequests;
const API_USER_AGENT = config.delayBetweenRequests
const USA_WEATHER_API = 'https://api.weather.gov/points/';
const USA_CITIES_FILE = './usaCities.json';
const USA_WEATHER_FILE = './usaWeather.json';

async function main() {
    const usaWeather = [];
    try {

        const usaCitiesList = await readJSONFile(USA_CITIES_FILE);

        for (let i = 0; i < 10; i++) {
            const response = await getData(usaCitiesList[i].lat, usaCitiesList[i].lng);
            if (response) {
                const cityObj = {
                    location: {
                        lat: usaCitiesList[i].lat,
                        lng: usaCitiesList[i].lng
                    }
                };
                const cityWeather = response.properties.periods.reduce((acc, day, index) => (
                    [...acc, {
                        updatedTimestamp: getTimeStamp(response.properties.updated),
                        fromHour: getTimeStamp(day.startTime),
                        toHour: getTimeStamp(day.endTime),
                        symbol: day.shortForecast,
                        temperatureC: convertToC(day.temperature),
                        windSpeedMps: toMps(day.windSpeed)
                    }]
                ), []);
                cityObj.weather = cityWeather;
                usaWeather.push(cityObj);
                console.error('Location (' + cityObj.location.lat + ',' + cityObj.location.lng + ') updated');
                // if (i % 25 === 0)
                //     await writeJSONFile(USA_WEATHER_FILE, usaWeather);
            }
            sleep.sleep(SLEEP_SECOND);

        }


    } catch (error) {
        console.error(error);
    } finally {
        console.log(JSON.stringify(usaWeather, null, 2));
        // await writeJSONFile(USA_WEATHER_FILE, usaWeather);
    }

}

async function getData(lat, lng) {
    try {
        const url = USA_WEATHER_API + lat + ',' + lng + '/forecast';
        const response = await axios.get(url,
            {
                headers: {
                    "user-agent": API_USER_AGENT
                }
            });
        return response.data;
    } catch (error) {
        if (error.response) { // The request was made and the server responded with a status code
            console.error('ERROR:', error.response.data);
        }
        else {
            throw error;
        }
    }
}

function convertToC(tempF) {
    let tempC = (tempF - 32) / 1.8;
    return +tempC.toFixed(2);
    // The plus sign that drops any "extra" zeroes at the end.
    // It changes the result (which is a string) into a number again 
}

function toMps(mph) {
    let mps = 0.4470389 * Number(mph.replace(/(^\d+)(.+$)/i, '$1'))
    return +mps.toFixed(2);
}

function getTimeStamp(dateStr) {
    return new Date(dateStr).getTime() / 1000;
}

main();