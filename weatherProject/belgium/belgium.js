"use strict";

const { writeFile, readFile } = require("fs");
const { promisify } = require("util");

const readWithPromise = promisify(readFile);
const writeWithPromise = promisify(writeFile);

function writeJSONFile(path, data) {
    return writeWithPromise(path, JSON.stringify(data, null, 2));
}

function readJSONFile(path) {
    return readWithPromise(path, "utf8").then(JSON.parse);
}

const cheerio = require('cheerio');
const axios = require('axios');
const coords = require('../data.json');
const belgium = 'http://www.meteo.be/meteo/view/en/123386-Observations.html';

async function main() {
    try {
        const res = await axios.get(belgium);
        const object = cheerio.load(res.data);

        const cities = object('table city')
            .toArray()
            .map(city => city.children[0].data)
            .map(city => {
                const getCities = coords.find(elem => elem.name === city);
                if (!getCities) return;
                return {
                    name: city,
                    lat: getCities.lat,
                    lng: getCities.lng
                };
            })

        const data = object("tbody > tr")
            .toArray()
            .map(row =>
                row.children
                    .filter(cell => cell.name === "td" && cell.type === "tag")
                    .map(td => td.children[0] && td.children[0].data)
            );

        data.splice(0, 2);
        data.forEach(elem => elem.shift());
        data.forEach(arr => {
            arr[4] = (arr[4] * 0.277777778).toFixed(2);
        });

        let tempSum = 0;
        data.forEach(arr => {
            if (arr[0] !== '-') {
                tempSum += parseFloat(arr[0])
            }
        });

        let pressureSum = 0;
        data.forEach(arr => {
            if (arr[2] !== '-') {
                pressureSum += parseFloat(arr[2])
            }
        });

        let humiditySum = 0;
        data.forEach(arr => {
            if (arr[1] !== '-') {
                humiditySum += parseFloat(arr[1])
            }
        });

        const array = []
        const obj = {
            timeStampRun: Math.round((new Date()).getTime() / 1000),
            source: 'RMI observations Belgium',
            countOfItems: cities.length,
            sumOfTemp: tempSum,
            sumOfHumidity: humiditySum,
            sumOfPressure: pressureSum,
            timeLastUpdate: object('.table').children('h3').text(),
            latsLongs: cities
        };
        array.push(obj)

        const addData = await readJSONFile("./belgium-app/src/stats/stats.json");
        addData.push(obj);
        await writeJSONFile("./belgium-app/src/stats/stats.json", addData);

    } catch (error) {
        console.log(error);
    }
}
main();
