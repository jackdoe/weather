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
