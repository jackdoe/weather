import React, { Component } from 'react';
//import logo from './logo.svg';
import './App.css';
import Chart from 'react-google-charts';
import stateArray from './states/state.json';

class App extends Component {

  state = {
    dataLoadingStatus: 'loading',
    ChartData: [],
    itemsCountChart: []
  };

  componentWillMount() {
    const columns = [
      { type: 'date', label: 'Time' },
      { type: 'number', label: 'TempC sum' },
      { type: 'number', label: 'WindMps sum' },
    ];
    const itemsCountColumns = [
      { type: 'date', label: 'Time' },
      { type: 'number', label: 'Item count' }
    ];
    let rows = [];
    let itemsCountRows = [];
    for (let item of stateArray) {
      const { timeStampRun, sumOfTempC, sumOfWind, countOfItems } = item;
      rows.push([new Date(timeStampRun * 1000), sumOfTempC, sumOfWind]);
      itemsCountRows.push([new Date(timeStampRun * 1000), countOfItems]);
    }
    this.setState({
      chartData: [columns, ...rows],
      itemsCountChart: [itemsCountColumns, ...itemsCountRows],
      dataLoadingStatus: 'ready',
      title: stateArray[0].nameOfApi,
    })
  }

  render() {
    console.log(this.state.chartData);
    return (
      <div className="App">
        <div style={{ display: 'flex', maxWidth: 900 }}>
          <Chart
            width={'500px'}
            height={'300px'}
            chartType="LineChart"
            loader={<div>Loading Chart</div>}
            data={this.state.chartData}
            options={{
              title: this.state.title,
              // isStacked: relative,
              //hAxis: { title: 'Year', titleTextStyle: { color: '#333' } },
              //vAxis: { minValue: -100 },
              // For the legend to fit, we make the chart area smaller
              //chartArea: { width: '60%', height: '70%' },
              // lineWidth: 25,
              // series: {
              //   2: { curveType: 'function' },
              // },
            }}
          />
          <Chart
            width={'500px'}
            height={'300px'}
            chartType="LineChart"
            loader={<div>Loading Chart</div>}
            data={this.state.itemsCountChart}
            options={{
              title: this.state.title,
              // isStacked: relative,
              //hAxis: { title: 'Year', titleTextStyle: { color: '#333' } },
              //vAxis: { minValue: -100 },
              // For the legend to fit, we make the chart area smaller
              //chartArea: { width: '60%', height: '70%' },
              // lineWidth: 25,
              // series: {
              //   2: { curveType: 'function' },
              // },
            }}
          />
        </div>
      </div>
    );
  }
}

export default App;
