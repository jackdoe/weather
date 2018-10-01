const axios = require("axios");
const { merge } = require("lodash");
const Promise = require("bluebird");

const dataUrl = "http://nwp.gov.eg/images/gallery/AgroMet/Data";

function weatherPerElem(weatherElemName, weatherElemFile) {
  return axios(`${dataUrl}/${weatherElemFile}`).then(res => {
    const weatherElemData = res.data;
    const lines = weatherElemData
      .trim()
      .split("\n")
      .map(l => l.trim());
    const timeStamps = lines[1].split(/\s+/gi).slice(3);

    const stations = lines.slice(3).reduce((all, st) => {
      const station = st.split(/\s+/gi);
      return {
        ...all,
        [station[0]]: {
          location: {
            lat: station[1],
            lng: station[2]
          },
          weather: station.slice(3).reduce(
            (w, weatherDaily, i) => ({
              ...w,
              [timeStamps[i]]: {
                [weatherElemName]: weatherDaily
              }
            }),
            {}
          )
        }
      };
    }, {});

    return stations;
  });
}

weatherElems = [
  { name: "evapotranspiration", filename: "forecast_evapotranspiration.txt" },
  { name: "tempMax", filename: "forecast_maximumtemperature.txt" },
  { name: "tempC", filename: "forecast_meantemperature.txt" },
  { name: "tempMin", filename: "forecast_minimumtemperature.txt" },
  { name: "precipitation", filename: "forecast_precipitation.txt" },
  { name: "humidity", filename: "forecast_relativehumidity.txt" },
  { name: "windDirection", filename: "forecast_wind_direction.txt" },
  { name: "windSpeed", filename: "forecast_wind_speed.txt" }
];

Promise.mapSeries(weatherElems, el =>
  weatherPerElem(el.name, el.filename)
).then(stations => {
  const allMerged = merge({}, ...stations);

  const egy = Object.keys(allMerged).map(station => {
    const stationWeather = allMerged[station];
    return {
      location: { ...stationWeather.location, name: station },
      weather: Object.keys(stationWeather.weather).map(ts => ({
        ...stationWeather.weather[ts],
        date: ts
      }))
    };
  });

  console.log(JSON.stringify(egy));
});
