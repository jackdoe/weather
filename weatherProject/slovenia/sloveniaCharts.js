// const { writeFile, readFile } = require("fs");
// const { promisify } = require("util");

// const readWithPromise = promisify(readFile);
// const writeWithPromise = promisify(writeFile);

// function writeJSONFile(path, data) {
//   return writeWithPromise(path, JSON.stringify(data, null, 2));
// }

// function readJSONFile(path) {
//   return readWithPromise(path, "utf8").then(JSON.parse);
// }

// const slovenia = 'http://meteo.arso.gov.si/uploads/probase/www/observ/surface/text/en/observation_si_latest.xml';
// const http = require('http');
// const parseString = require('xml2js').parseString;

// async function main() {
//   try {
//     let xml = '';
//     //http://antrikshy.com/blog/fetch-xml-url-convert-to-json-nodejs
//     function xmlToJson(url, callback) {
//       let req = http.get(url, function (res) {
//         let xml = '';

//         res.on('data', function (chunk) {
//           xml += chunk;
//         });

//         res.on('error', function (e) {
//           callback(e, null);
//         });

//         res.on('timeout', function (e) {
//           callback(e, null);
//         });

//         res.on('end', function () {
//           parseString(xml, function (err, result) {
//             callback(null, result);
//           });
//         });
//       });
//     }

//     xmlToJson(slovenia, function (err, data) {
//       if (err) {
//         return console.err(err);
//       }

//       xmlData = data.data.metData
//       const cities = xmlData.map(arr => {
//         return {
//           StationName: (arr.domain_longTitle).toString(),
//           lat: parseFloat((arr.domain_lat).toString()),
//           long: parseFloat((arr.domain_lon).toString()),
//           altitude: parseFloat((arr.domain_altitude).toString())
//         };
//       });

//       let tempSum = 0;
//       xmlData.forEach(arr => {
//         if (isNaN(parseFloat((arr.t).toString()))) {
//           parseFloat((arr.t).toString()) = 0
//         }
//         tempSum += parseFloat((arr.t).toString())
//       });
//       console.log(tempSum)

//       let pressureSum = 0;
//       xmlData.forEach(arr => {
//         if ((arr.p).toString() !== '') {
//           pressureSum += parseFloat((arr.p).toString())
//           }
//       });
//       console.log(pressureSum)

//       let humiditySum = 0;
//       xmlData.forEach(arr => {
//           if ((arr.rh).toString() !== '') {
//               humiditySum += parseFloat((arr.rh).toString())
//           }
//       });
//       console.log(humiditySum)

//       const array = []
//       const obj = {
//           timeStampRun: Math.round((new Date()).getTime() / 1000),
//           source: 'ASRO Slovenia observations',
//           countOfItems: cities.length,
//           sumOfTemp: tempSum,
//           sumOfHumidity: humiditySum,
//           sumOfPressure: pressureSum,
//           // timeLastUpdate:(da.tsUpdated_UTC).toString(),
//           latsLongs: cities
//       };
//       array.push(obj)
//       console.log(array)
//       // const addData = await readJSONFile("./belgium-app/src/stats/stats.json");
//       // addData.push(obj);
//       // await writeJSONFile("./belgium-app/src/stats/stats.json", addData);

//     });

//   } catch (error) {
//     console.log(error)
//   }
// }
// main()