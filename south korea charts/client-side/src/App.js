import React from "react";
import GoogleChart from "./GoogleChart";
import "./App.css";

class App extends React.Component {
  state = {
    stats: {},
    temp: null,
    wind: null,
    humidity: null,
    pressure: null,
    itemsCount: null
  };

  fetchStats = async () => {
    const res = await fetch("/api/stats");
    const stats = await res.json();
    this.setState({ stats });
    return stats;
  };

  generateCharts = async () => {
    const data = await this.fetchStats();

    const dataType = { type: "date", label: "Hour" };
    const dataTypeAndLabel = [
      [dataType, "SumOf Temperature °C"],
      [dataType, "Sum of Wind Speed MPS"],
      [dataType, "Sum of Humidity %"],
      [dataType, "Sum of Pressure hPa"],
      [dataType, "Cities Count"]
    ];

    const temp = [dataTypeAndLabel[0]];
    const wind = [dataTypeAndLabel[1]];
    const humidity = [dataTypeAndLabel[2]];
    const pressure = [dataTypeAndLabel[3]];
    const itemsCount = [dataTypeAndLabel[4]];
    for (let file of data) {
      const {
        timeIssued,
        sumOftempC,
        sumOfWindMS,
        sumOfHumidityPercent,
        sumOfPressureHPA,
        totalItems
      } = file;
      const time = new Date(new Date(timeIssued * 1000));
      temp.push([time, sumOftempC]);
      wind.push([time, sumOfWindMS]);
      humidity.push([time, sumOfHumidityPercent]);
      pressure.push([time, sumOfPressureHPA]);
      itemsCount.push([time, totalItems]);
    }

    this.setState({ temp, wind, humidity, pressure, itemsCount });
  };

  componentDidMount() {
    this.generateCharts();
  }

  render() {
    return (
      <div className="App">
        <h2 className="api-name">Korea Meteorological Administration</h2>
        <GoogleChart weatherStats={this.state.temp} />
        <GoogleChart weatherStats={this.state.wind} />
        <GoogleChart weatherStats={this.state.humidity} />
        <GoogleChart weatherStats={this.state.pressure} />
        <GoogleChart
          chartType={"AreaChart"}
          weatherStats={this.state.itemsCount}
        />
      </div>
    );
  }
}

export default App;
