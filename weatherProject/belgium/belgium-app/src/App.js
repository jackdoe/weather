import React, { Component } from 'react';
import Chart from 'react-google-charts';
import stats from './stats/stats.json';

class App extends Component {
  state = {
    dataLoadingStatus: 'loading',
    ChartData: [],
    pressureData: [],
    counterData: []
  };

  componentWillMount() {
    const columns = [
      { type: 'date', label: 'Time' },
      { type: 'number', label: 'Sum of temperature' },
      { type: 'number', label: 'Sum of humidity' },
    ];

    const pressureColumns = [
      { type: 'date', label: 'Time' },
      { type: 'number', label: 'Sum of pressure' },
    ];
    const counterColumns = [
      { type: 'date', label: 'Time' },
      { type: 'number', label: 'items' },
    ]

    let rows = [];
    let pressureRows = [];
    let counterRows = [];
    for (let item of stats) {
      const { timeStampRun, sumOfTemp, sumOfHumidity, sumOfPressure, countOfItems } = item;
      rows.push([new Date(timeStampRun * 1000), sumOfTemp, sumOfHumidity]);
      pressureRows.push([new Date(timeStampRun * 1000), sumOfPressure])
      counterRows.push([new Date(timeStampRun * 1000), countOfItems])
    }
    this.setState({
      chartData: [columns, ...rows],
      pressureData: [pressureColumns, ...pressureRows],
      counterData: [counterColumns, ...counterRows],
      dataLoadingStatus: 'ready',
      title: stats[0].source,
    })
  }

  render() {
    return (
      <div style={{ display: 'flex', maxWidth: 900 }}>
        <Chart
          width={'500px'}
          height={'400px'}
          chartType="LineChart"
          loader={<div>Loading Chart</div>}
          data={this.state.chartData}
          options={{
            title: this.state.title,
            hAxis: {
              title: 'Time',
            },
            vAxis: {
              title: 'Sum',
            },
            series: {
              1: { curveType: 'function' },
            },

          }}
          rootProps={{ 'data-testid': '2' }}
        />
        <Chart
          width={'500px'}
          height={'400px'}
          chartType="LineChart"
          loader={<div>Loading Chart</div>}
          data={this.state.pressureData}
          options={{
            title: this.state.title,
            hAxis: {
              title: 'Time',
            },
            vAxis: {
              title: 'Sum',
            },
            series: {
              1: { curveType: 'function' },
            },

          }}
          rootProps={{ 'data-testid': '2' }}
        />

        <Chart
          width={'500px'}
          height={'400px'}
          chartType="LineChart"
          loader={<div>Loading Chart</div>}
          data={this.state.counterData}
          options={{
            title: this.state.title,
            hAxis: {
              title: 'Time',
            },
            vAxis: {
              title: 'Sum',
            },
            series: {
              1: { curveType: 'function' },
            },
          }}
          rootProps={{ 'data-testid': '2' }}
        />
      </div>
    );
  }
}

export default App;
