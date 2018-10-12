import React, { Component } from "react";
import "./App.css";
import ChartComponent from "./ChartComponent";

class App extends Component {
  state = {};
  getStats = async () => {
    const res = await fetch("/api/getStats");
    const statsData = await res.json();
    return statsData;
  };

  tempChart = async () => {
    const statsData = await this.getStats();
    let tempChartData = [
      [{ type: "date", label: "Hour" }, "SumOf Temperature"]
    ];

    statsData.forEach(stat => {
      const { sumOfTemp, timeStamp } = stat;
      const timeForData = new Date(timeStamp * 1000);
      tempChartData.push([timeForData, sumOfTemp]);
    });

    this.setState({ sumOfTemp: tempChartData });
  };

  pressureChart = async () => {
    const statsData = await this.getStats();
    let pressureChartData = [
      [{ type: "date", label: "Hour" }, "SumOf Pressure"]
    ];

    statsData.forEach(stat => {
      const { sumOfPressure, timeStamp } = stat;
      const timeForData = new Date(timeStamp * 1000);
      pressureChartData.push([timeForData, sumOfPressure]);
    });

    this.setState({ sumOfPressure: pressureChartData });
  };

  humidityChart = async () => {
    const statsData = await this.getStats();
    let humidityDataChart = [
      [{ type: "date", label: "Hour" }, "SumOf Humidity"]
    ];
    statsData.forEach(stat => {
      const { sumOfHumidity, timeStamp } = stat;
      const timeForData = new Date(timeStamp * 1000);
      humidityDataChart.push([timeForData, sumOfHumidity]);
    });

    this.setState({ sumOfHumidity: humidityDataChart });
  };

  windChart = async () => {
    const statsData = await this.getStats();
    let windDataChart = [[{ type: "date", label: "Hour" }, "SumOf Wind"]];
    statsData.forEach(stat => {
      const { sumOfWindSpeed, timeStamp } = stat;
      const timeForData = new Date(timeStamp * 1000);
      windDataChart.push([timeForData, sumOfWindSpeed]);
    });
    this.setState({ sumOfWind: windDataChart });
  };

  componentDidMount() {
    this.getStats();
    this.tempChart();
    this.pressureChart();
    this.humidityChart();
    this.windChart();
  }

  render() {
    return (
      <div className="App">
        <ChartComponent data={this.state.sumOfTemp} />
        <ChartComponent data={this.state.sumOfPressure} />
        <ChartComponent data={this.state.sumOfHumidity} />
        <ChartComponent data={this.state.sumOfWind} />
      </div>
    );
  }
}

export default App;
