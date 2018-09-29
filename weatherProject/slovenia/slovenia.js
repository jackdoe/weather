const cheerio = require('cheerio');
const axios = require('axios');
const coords = require('../data.json');
const slovenia = 'http://meteo.arso.gov.si/uploads/probase/www/observ/surface/text/en/observation_si_latest.html';

async function main() {
    try {
        const res = await axios.get(slovenia);
        const object = cheerio.load(res.data);

        const cities = object('table .meteoSI-th')
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

        const data = object('tbody > tr')
            .toArray()
            .map(row => row.children
                .filter(cell => cell.name === 'td' && cell.type === 'tag')
                .map(td => td.children[0] && td.children[0].data));
        data.forEach(elem => elem.splice(0, 2));
        data.forEach(elem => elem.splice(7, 1));
        data.forEach(elem => elem.splice(2, 1));
        data.forEach(elem => elem.splice(5, 1));

        data.forEach(arr => {
            arr[2] = (arr[2] * 0.277777778).toFixed(2);
        });
        data.forEach(arr => {
            arr[4] = arr[4].replace('*\n\t\t', '')
        });
        const objects = data.map(arr => {
            return {
                Time: object('.meteoSI-header').text(),
                Temperature: parseFloat(arr[1]),
                Pressure: parseFloat(arr[4]),
                WindSpeed: parseFloat(arr[2]),
                WindGust: arr[3],
                WeatherType: arr[0]
            };
        });

        const array = [];
        for (i = 0; i < data.length; i++) {
            const obj = {
                location: cities[i],
                weather: [objects[i]]
            }
            array.push(obj)
        }

        console.log(JSON.stringify(array, null, 2));
    } catch (error) {
        console.log(error)
    }
}
main()