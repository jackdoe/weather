const fetch = require("node-fetch");
const sleep = require("sleep");
const geolib = require("geolib");
const fs = require('fs');
const PATH = `sweden_results.json`;

fs.writeFile(PATH, JSON.stringify([]), (err) => {
    if (err) throw err;
    console.log('Empty json file has been created');
});

const baseUrl = 'https://opendata-download-metfcst.smhi.se/api/category/pmp3g/version/2/geotype'; //setting base url with all static parameters
const coordinatesUrl = `${baseUrl}/multipoint.json?downsample=2`; //getting coordinates from the api

//declaring polygon variable from the api it can be fetched with `${baseUrl}/polygon.json`;
const polygonBoundaries = [
    { latitude: 52.50044, longitude: 2.250475 },
    { latitude: 52.542473, longitude: 27.392184 },
    { latitude: 70.742227, longitude: 37.934697 },
    { latitude: 70.666011, longitude: -8.553029 }
];

//@param url the url for fetching the forecast data 
//@param chunkSize the number of coordinates to be used in one fetch request
//@param pausing the number of seconds the application will take before making another fetch request

const getWeatherData = async (url, chunkSize, pausing) => {
    try {
        const responseCoordinates = await fetch(url);
        if (responseCoordinates.status !== 200) {
            console.log(`Error: ${responseCoordinates.status} - ${responseCoordinates.statusText}`, responseCoordinates);
        }
        const coordinatesCities = await responseCoordinates.json();
        const testedInBoundaries = coordinatesCities.coordinates.filter(city => {
            return geolib.isPointInside({ latitude: city[1], longitude: city[0] }, polygonBoundaries);
        });
        
        //for loop to make fetch in chunks that can be assigend with passing chunkSize to the getWeatherData function
        for (let i = 0; i < testedInBoundaries.length; i += chunkSize) {

            console.log(i, i + chunkSize -1);
            const slicedCoordinates = testedInBoundaries.slice(i, i + chunkSize - 1); //slicing testedInBoundaries array to a chunckSize array
            
            //fetching forecast data for the slicedCoordinates array
            const forecastResults = await Promise.all(
                slicedCoordinates.map( 
                    async testedCoordinates => {
                        sleep.sleep(pausing); // pausing before making each fetch
                        const result = await fetch(`${baseUrl}/point/lon/${Math.floor(testedCoordinates[0] * 1000000) / 1000000}/lat/${Math.floor(testedCoordinates[1] * 1000000) / 1000000}/data.json`);
                        if (result.status !== 200) {
                            console.log(`Error: ${result.status} - ${result.statusText}`, testedCoordinates);
                        }
                        return await result.json();
                    }
                )
            );

            //getting altitude information for the slicedCoordinates array;
            const fullCoordinates = await Promise.all(
                slicedCoordinates.map(
                    async coordinates => {
                        sleep.sleep(2);
                        const altitude = await fetch(`https://api.open-elevation.com/api/v1/lookup\?locations\=${coordinates[1]},${coordinates[0]}`);
                        if (altitude.status !== 200) {
                            console.log(`${altitude.status} - ${altitude.statusText}`, coordinates);
                        }
                        return await altitude.json();
                    }
                )
            );

            //structuring response of fullCoordinates for easier access
            const structuredCoordinates = fullCoordinates.map(result => {
                return {
                    longitude: result.results[0].longitude,
                    latitude: result.results[0].latitude,
                    altitude: result.results[0].elevation
                }
            });
            
            //structuring the result in the favored output format
            const results = forecastResults.map(forecast => {
                return {
                    location: {
                        timeStamp: forecast.approvedTime,
                        lng: forecast.geometry.coordinates[0][0],
                        lat: forecast.geometry.coordinates[0][1],
                        alt: structuredCoordinates
                            .filter(coordinates =>
                                coordinates.longitude === forecast.geometry.coordinates[0][0]
                                && coordinates.latitude === forecast.geometry.coordinates[0][1]
                            )
                            .map(coordinates => coordinates.altitude)[0][0],
                    },
                    weather:
                        forecast.timeSeries.map(result => {
                            return {
                                time: result.validTime,
                                tempC: result.parameters
                                    .filter(parameter => {
                                        return parameter.name === 't'
                                    })
                                    .map(parameter => {
                                        return parameter.values;
                                    })[0][0],
                                pressureHPA: result.parameters
                                    .filter(parameter => {
                                        return parameter.name === 'msl'
                                    })
                                    .map(parameter => {
                                        return parameter.values;
                                    })[0][0],
                                humidityPercent: result.parameters
                                    .filter(parameter => {
                                        return parameter.name === 'r';
                                    })
                                    .map(parameter => {
                                        return parameter.values;
                                    }
                                    )[0][0],
                                windDirectionDeg: result.parameters
                                    .filter(parameter => {
                                        return parameter.name === 'wd';
                                    })
                                    .map(parameter => {
                                        return parameter.values;
                                    }
                                    )[0][0],
                                windSpeedMps: result.parameters
                                    .filter(parameter => {
                                        return parameter.name === 'ws';
                                    })
                                    .map(parameter => {
                                        return parameter.values;
                                    }
                                    )[0][0],
                                cloudinessOCTAS: result.parameters
                                    .filter(parameter => {
                                        return parameter.name === 'tcc_mean';
                                    })
                                    .map(parameter => {
                                        return parameter.values;
                                    }
                                    )[0][0],
                                lowCloudsOCTAS: result.parameters
                                    .filter(parameter => {
                                        return parameter.name === 'lcc_mean';
                                    })
                                    .map(parameter => {
                                        return parameter.values;
                                    }
                                    )[0][0],
                                mediumCloudsOCTAS: result.parameters
                                    .filter(parameter => {
                                        return parameter.name === 'mcc_mean';
                                    })
                                    .map(parameter => {
                                        return parameter.values;
                                    }
                                    )[0][0],
                                highCloudsOCTAS: result.parameters
                                    .filter(parameter => {
                                        return parameter.name === 'hcc_mean';
                                    })
                                    .map(parameter => {
                                        return parameter.values;
                                    }
                                    )[0][0],
                                lng: forecast.geometry.coordinates[0][0],
                                lat: forecast.geometry.coordinates[0][1], 
                            };
                        }
                    )
                }
            });
            // used only when needed to save results
            fs.readFile(PATH, 'utf8' , (err, data) => {
                if (err) throw err;
                
                const json = JSON.parse(data);
                results.forEach(result => {
                    json.push(result);
                });

                fs.writeFile(PATH, JSON.stringify(json, null, 2), (err) => {
                    if (err) throw err;
                    console.log('The file has been saved!');
                });
            });
        }
    } catch (error) {
        console.error(error);
    }
};

getWeatherData(coordinatesUrl, 5, 2);