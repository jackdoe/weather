import React from "react";
import Chart from "react-google-charts";

export default class GoogleChart extends React.Component {
  render() {
    const { weatherStats, chartType } = this.props;

    const options = {
      hAxis: {
        title: "Time"
      },
      vAxis: {
        title: "Measurements"
      },
      series: {
        1: { curveType: "function" }
      },
      colors: ["#222"],
      lineWidth: 3,
      pointSize: 5,
      pointShape: { type: "circle", sides: 4 },
      background: "blue"
    };

    return (
      <Chart
        className="chart"
        width={"500px"}
        height={"400px"}
        chartType={chartType || "LineChart"}
        loader={<div>Loading Chart</div>}
        options={options}
        data={weatherStats}
        rootProps={{ "data-testid": "2" }}
      />
    );
  }
}

/* 
was in app.js 
  drawCharts = async (str, propName, destination) => {
    // str: text to be displayd,
    // propNmae: from stats,
    // destination: to be stored in state (must exist)

    const data = await this.getStats();
    const dataHead = [{ type: "date", label: "Hour" }, str]; // can unshift
    destination = [dataHead];

    for (let file of data) {
      //TODO: make it a function and get one property at a time
      const { timeIssued, propName } = file;
      const time = new Date(new Date(timeIssued * 1000));
      destination.push([time, propName]);
    }
    this.setState({ destination });
  };
*/
