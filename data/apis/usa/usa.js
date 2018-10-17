'use strict';

const axios = require('axios');
const sleep = require('sleep');
const { readJSONFile } = require('./fileOperations');
const Windrose = require('windrose');

const { SLEEP_IN_SECOND, USA_API_USERAGENT } = require('../config/config.js');
const USA_WEATHER_API = 'https://api.weather.gov/points/';
const USA_CITIES_FILE = './usaCities.json';

async function main() {
    const usaWeather = [];
    try {

        let usaCitiesList = await readJSONFile(USA_CITIES_FILE);
        usaCitiesList = await shuffle(usaCitiesList);

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
                        windSpeedMps: toMps(day.windSpeed),
                        windDirectionDeg: Windrose.getDegrees(day.windDirection).value
                    }]
                ), []);
                cityObj.weather = cityWeather;
                usaWeather.push(cityObj);
                console.error('Location (' + cityObj.location.lat + ',' + cityObj.location.lng + ') updated');

            }
            sleep.sleep(SLEEP_IN_SECOND);

        }


    } catch (error) {
        console.error(error);
    } finally {
        console.log(JSON.stringify(usaWeather, null, 2));
    }

}

async function getData(lat, lng) {
    try {
        const url = USA_WEATHER_API + lat + ',' + lng + '/forecast';
        const response = await axios.get(url,
            {
                headers: {
                    "user-agent": USA_API_USERAGENT
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

async function shuffle(array) {
    let currentIndex = array.length, temporaryValue, randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
}

main();