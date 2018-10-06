import React, { Component } from 'react';
import Chart from 'react-google-charts';

class WeatherChart extends Component {
  render() {
    return (
      <Chart
        width={'500px'}
        height={'300px'}
        chartType="LineChart"
        loader={<div>Loading Chart</div>}
        data={this.props.chartData}
        options={{
          title: this.props.title,
        }}
      />
    );
  }
}

export default WeatherChart;