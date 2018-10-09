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
    itemsCount: null,

    data: {
      totalItemsData: null,
      sumOftempCData: null,
      sumOfWindMSData: null,
      sumOfPressureHPAData: null,
      sumOfHumidityPercentData: null
    }
  };

  // generateTempChart = async () => {
  //   const data = await this.getStats();
  //   const dataHead = [{ type: "date", label: "Hour" }, "SumOf Temperature °C"];
  //   const temp = [dataHead];

  //   for (let file of this.state.stats) {
  //     const {
  //       timeIssued,
  //       sumOftempC
  //       // apiName,
  //       // totalItems,
  //       // sumOfWindMS,
  //       // sumOfPressureHPA,
  //       // timeLastUpdate
  //     } = file;
  //     // const date = new Date(timeIssued); // millisiconds
  //     // const time = new Date(date * 1000);
  //     const time = new Date(new Date(timeIssued * 1000));
  //     temp.push([time, sumOftempC]);
  //   }
  //   this.setState({ temp });
  // };

  // generateItemsCountChart = async () => {
  //   // const data = await this.getStats();

  //   const dataHead = [{ type: "date", label: "Hour" }, "Count of Items"];
  //   const itemsCount = [dataHead];

  //   for (let file of this.state.stats) {
  //     const { timeIssued, totalItems } = file;
  //     const time = new Date(new Date(timeIssued * 1000));
  //     itemsCount.push([time, totalItems]);
  //   }
  //   this.setState({ itemsCount });
  // };

  // generateWindChart = async () => {
  //   //*
  //   // const data = await this.getStats();

  //   const dataHead = [{ type: "date", label: "Hour" }, "Sum of Wind Speed"];
  //   const wind = [dataHead];

  //   for (let file of this.state.stats) {
  //     const { timeIssued, sumOfWindMS } = file;
  //     const time = new Date(new Date(timeIssued * 1000));
  //     wind.push([time, sumOfWindMS]);
  //   }
  //   this.setState({ wind });
  //   console.log(wind);
  // };

  // generateHumidityChart = async () => {
  //   //*
  //   // const data = await this.getStats();

  //   const dataHead = [{ type: "date", label: "Hour" }, "Sum of Humidity %"];
  //   const humidity = [dataHead];

  //   for (let file of this.state.stats) {
  //     const { timeIssued, sumOfHumidityPercent } = file;
  //     const time = new Date(new Date(timeIssued * 1000));
  //     humidity.push([time, sumOfHumidityPercent]);
  //   }
  //   this.setState({ humidity });
  // };

  // generatePressureChart = async () => {
  //   //*
  //   // const data = await this.getStats();

  //   const dataHead = [{ type: "date", label: "Hour" }, "Sum of Pressure hPa"];
  //   const pressure = [dataHead];

  //   for (let file of this.state.stats) {
  //     const { timeIssued, sumOfPressureHPA } = file;
  //     const time = new Date(new Date(timeIssued * 1000));
  //     pressure.push([time, sumOfPressureHPA]);
  //   }
  //   this.setState({ pressure });
  // };

  generateCharts = async () => {
    const data = await this.getStats();

    const dataHead = [{ type: "date", label: "Hour" }, "Sum of Pressure hPa"];

    const temp = [dataHead];
    const itemsCount = [dataHead];
    const wind = [dataHead];
    const humidity = [dataHead];
    const pressure = [dataHead];
    for (let file of data) {
      const {
        apiName,
        timeLastUpdate,
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

  getStats = async () => {
    const res = await fetch("/api/stats");
    const stats = await res.json();
    this.setState({ stats });
    return stats;
  };

  componentDidMount() {
    // this.getStats();
    // this.generateTempChart();
    // this.generateWindChart();
    // this.generatePressureChart();
    // this.generateHumidityChart();
    // this.generateItemsCountChart();

    this.generateCharts();
  }

  render() {
    return (
      <div className="App">
        <GoogleChart weatherStats={this.state.temp} />
        <GoogleChart weatherStats={this.state.wind} />
        <GoogleChart weatherStats={this.state.humidity} />
        <GoogleChart weatherStats={this.state.pressure} />
        <GoogleChart
          chartType="AreaChart"
          weatherStats={this.state.itemsCount}
        />
      </div>
    );
  }
}

export default App;
