import React, { Component } from 'react';
import './App.css';
import WeatherChart from './components/WeatherChart.js';

class App extends Component {

  state = {
    dataLoadingStatus: 'loading',
    tempChart: [],
    itemsCountChart: [],
    windChart: [],
    lastUpdateChart: [],
    tempDiffWithMetnoChart: []
  };

  updateState = (stateArray) => {

    const tempColumns = [
      { type: 'date', label: 'Time' },
      { type: 'number', label: 'Temp sum' },
    ];
    const windColumns = [
      { type: 'date', label: 'Time' },
      { type: 'number', label: 'Wind sum' },
    ];
    const itemsCountColumns = [
      { type: 'date', label: 'Time' },
      { type: 'number', label: 'Item count' }
    ];
    const lastUpdateColumns = [
      { type: 'date', label: 'Time' },
      { type: 'number', label: 'Last Update' },
    ];
    const tempDiffWithMetnoColumns = [
      { type: 'date', label: 'Time' },
      { type: 'number', label: 'Met.no diff' },
    ];

    let tempRows = [];
    let itemsCountRows = [];
    let windRows = [];
    let lastUpdateRows = [];
    let tempDiffWithMetnoRows = [];

    for (let item in stateArray) {

      const { timeStampRun,
        sumOfTempC,
        sumOfWind,
        countOfItems,
        lastUpdate,
        sumOfTempCDiffWithMetno } = stateArray[item];
      const rowDate = new Date(timeStampRun * 1000);
      tempRows.push([rowDate, sumOfTempC]);
      itemsCountRows.push([rowDate, countOfItems]);
      windRows.push([rowDate, sumOfWind]);
      lastUpdateRows.push([rowDate, (timeStampRun - lastUpdate) / 60]);
      tempDiffWithMetnoRows.push([rowDate, sumOfTempCDiffWithMetno]);

    }

    this.setState({
      tempChart: [tempColumns, ...tempRows],
      windChart: [windColumns, ...windRows],
      itemsCountChart: [itemsCountColumns, ...itemsCountRows],
      lastUpdateChart: [lastUpdateColumns, ...lastUpdateRows],
      tempDiffWithMetnoChart: [tempDiffWithMetnoColumns, ...tempDiffWithMetnoRows],
      dataLoadingStatus: 'ready',
      title: stateArray[Object.keys(stateArray)[0]].nameOfApi,
    })

  }

  componentDidMount() {
    this.callApi()
      .then((data) => this.updateState(data))
      .catch(err => console.log(err));
    this.interval = setInterval(() => {
      this.callApi()
        .then((data) => this.updateState(data))
        .catch(err => console.log(err));
    }, 60000);

  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  callApi = async () => {
    const response = await fetch('/api/state');
    const body = await response.json();

    if (response.status !== 200) throw Error(body.message);

    return body;
  };

  render() {
    return (this.state.dataLoadingStatus === 'ready') ?
      <div className="App">
        <h2> {this.state.title} </h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
          <WeatherChart
            chartData={this.state.tempDiffWithMetnoChart} title='Sum of temp diff with Met.no' />
          <WeatherChart chartData={this.state.tempChart} title='Sum of temp C' />
          <WeatherChart chartData={this.state.windChart} title='Sum of wind mps' />
          <WeatherChart chartData={this.state.lastUpdateChart} title='Last update in minutes' />
          <WeatherChart chartData={this.state.itemsCountChart} title='Number of cities * days' />
        </div>
      </div>
      : <div> loading data </div>
      ;
  }
}

export default App;
