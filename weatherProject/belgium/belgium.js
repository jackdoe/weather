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

        const data = object('tbody > tr')
            .toArray()
            .map(row => row.children
                .filter(cell => cell.name === 'td' && cell.type === 'tag')
                .map(td => td.children[0] && td.children[0].data));

        data.splice(0, 2);
        data.forEach(elem => elem.shift());
        data.forEach(arr => {
            arr[4] = (arr[4] * 0.277777778).toFixed(2);
        });

        const objects = data.map(arr => {
            return {
                Time: object('.table').children('h3').text(),
                Temperature: parseFloat(arr[0]),
                Humidity: parseFloat(arr[1]),
                Pressure: parseFloat(arr[2]),
                WindDirection: arr[3],
                WindSpeed: parseFloat(arr[4]),
                WeatherType: arr[5]
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
