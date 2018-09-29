const axios = require("axios");

const egyptForecastBaseUrl = "http://nwp.gov.eg/images/gallery/AgroMet/Data/";

function parseWeatherElement(weatherElementfileName, weatherElementName) {
  const reqUrl = egyptForecastBaseUrl + weatherElementfileName;
  axios(reqUrl)
    .then(resp => {
      const lines = resp.data.replace(/\n+$/gi, "").split("\n");
      const headers = lines[1].trim().split(/\s+/gi);
      lines.slice(3).forEach(line => {
        const cells = line.split(/\s+/gi);
        const locWeather = {
          location: { name: cells[0], lat: cells[1], lng: cells[2] },
          weather: cells.slice(3).reduce(
            (acc, c, i) => ({
              ...acc,
              [headers[i + 3]]: { [weatherElementName]: c }
            }),
            {}
          )
        };
        console.log(locWeather);
      });
    })
    .then(console.log);
}

parseWeatherElement("forecast_evapotranspiration.txt", "evapotranspiration");
parseWeatherElement("forecast_maximumtemperature.txt", "tempMax");
parseWeatherElement("forecast_meantemperature.txt", "tempC");
parseWeatherElement("forecast_minimumtemperature.txt", "tempMin");
parseWeatherElement("forecast_precipitation.txt", "precipitation");
parseWeatherElement("forecast_relativehumidity.txt", "humidity");
parseWeatherElement("forecast_wind_direction.txt", "windDirection");
parseWeatherElement("forecast_wind_speed.txt", "windSpeed");
