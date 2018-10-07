const slovenia = 'http://meteo.arso.gov.si/uploads/probase/www/observ/surface/text/en/observation_si_latest.xml';
const http = require('http');
const parseString = require('xml2js').parseString;

async function main() {
    try {
        let xml = '';
        //http://antrikshy.com/blog/fetch-xml-url-convert-to-json-nodejs
        function xmlToJson(url, callback) {
            let req = http.get(url, function (res) {
                let xml = '';

                res.on('data', function (chunk) {
                    xml += chunk;
                });
                console.log(xml)

                res.on('error', function (e) {
                    callback(e, null);
                });

                res.on('timeout', function (e) {
                    callback(e, null);
                });

                res.on('end', function () {
                    parseString(xml, function (err, result) {
                        callback(null, result);
                    });
                });
            });
        }

        xmlToJson(slovenia, function (err, data) {
            if (err) {
                return console.err(err);
            }

            xmlData = data.data.metData
            const cities = xmlData.map(arr => {
                return {
                    StationName: (arr.domain_longTitle).toString(),
                    lat: parseFloat((arr.domain_lat).toString()),
                    long: parseFloat((arr.domain_lon).toString()),
                    altitude: parseFloat((arr.domain_altitude).toString())
                };
            });
            console.log(cities)
            const objects = xmlData.map(arr => {
                return {
                    TimeCEST: (arr.tsUpdated).toString(),
                    TimeUTC: (arr.tsUpdated_UTC).toString(),
                    Temperature: parseFloat((arr.t).toString()),
                    Pressure: parseFloat((arr.p).toString()),
                    WindSpeed: parseFloat((arr.ff_val).toString()),
                    WindDirection: (arr.dd_shortText).toString(),
                    WeatherType: (arr.wwsyn_shortText).toString(),
                    Humidity: parseFloat((arr.rh).toString())
                };
            });

            const array = [];
            for (i = 0; i < xmlData.length; i++) {
                const obj = {
                    location: cities[i],
                    weather: [objects[i]]
                }
                array.push(obj)
            }
            console.log(JSON.stringify(array, null, 2));
        });

    } catch (error) {
        console.log(error)
    }
}
main()