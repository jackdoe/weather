import React, { Component } from "react";
import Chart from "./components/Charts";
import img from "./Britain.png";
class App extends Component {
  state = {
    data: {}
  };
  componentWillMount() {
    this.callBackendAPI();
  }
  callBackendAPI = async () => {
    const response = await fetch("/data");
    const body = await response.json();
    if (response.status !== 200) {
      throw Error(body.message);
    }
    const timeStampRun = [];
    const countOfCities = [];
    const countOfItems = [];
    const sumOfTemp = [];
    const sumOfWind = [];
    const sumOfPressure = [];
    const forecastDate = [];
    const temperatureDifference = [];

    for (const prop in body.dir) {
      const file = body.dir[prop];
      timeStampRun.push(file.timeStampRun);
      countOfCities.push(file.countOfCities);
      countOfItems.push(file.countOfItems);
      sumOfTemp.push(file.sumOfTemp);
      sumOfWind.push(file.sumOfWind);
      sumOfPressure.push(file.sumOfPressure);
      forecastDate.push(file.forecastDate);
      temperatureDifference.push(file.temperatureDifference);
    }
    const tempChartData = {
      labels: forecastDate,
      datasets: [
        {
          label: "Sum of temp",
          data: sumOfTemp,
          borderColor: "red"
        },
        {
          label: "Sum of wind",
          data: sumOfWind,
          backgroundColor: "blue"
        }
      ]
    };
    const pressureChartData = {
      labels: forecastDate,
      datasets: [
        {
          label: "Sum of Pressure",
          data: sumOfPressure,
          borderColor: "#20fe23"
        }
      ]
    };
    const cityChartData = {
      labels: forecastDate,
      datasets: [
        {
          label: "Number of Cities ",
          data: countOfCities,
          backgroundColor: "#29c9ff"
        }
      ]
    };
    const temperatureDifferenceData = {
      labels: forecastDate,
      datasets: [
        {
          label: "Temperature difference compared with Met.no ",
          data: temperatureDifference,
          backgroundColor: "purple"
        }
      ]
    };
    this.setState({
      data: {
        tempChartData,
        pressureChartData,
        cityChartData,
        temperatureDifferenceData
      }
    });
  };
  render() {
    return (
      <div className="App">
        <header className="App-header" />
        <img src={img} width={45} alt="Britain flag" />
        <h2>United Kingdom</h2>
        <Chart data={this.state.data} />
      </div>
    );
  }
}
export default App;