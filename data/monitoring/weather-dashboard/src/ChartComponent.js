import React from "react";
import { Chart } from "react-google-charts";

export default class ChartComponent extends React.Component {
  render() {
    return (
      <Chart
        width={"600px"}
        height={"400px"}
        chartType="LineChart"
        loader={<div>Loading Chart</div>}
        data={this.props.data}
        options={{
          hAxis: {
            title: "Time"
          },
          vAxis: {
            title: `Measuring`
          }
        }}
      />
    );
  }
}
