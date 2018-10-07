import React, { Component } from 'react';
// import moment from 'moment';
import StatsList from './sources/listStats';
import Chart from 'react-google-charts';
import './App.css';

class App extends Component {
  state = {
    timestamprun: StatsList.map(stats => stats.timestamprun),
    nameofapi: StatsList[0].nameofapi,
    numberOfItems: StatsList.map(stats => [new Date(stats.timestamprun), stats.countOfItems]),
    sumOfTempC: StatsList.map(stats => [new Date(stats.timestamprun), stats.sumOfTempc]),
    sumOfWind: StatsList.map(stats => [new Date(stats.timestamprun), stats.sumOfWind]),
    sumOfPressure: StatsList.map(stats => [new Date(stats.timestamprun), stats.sumOfPressure]),
    sumOfHumidityPer: StatsList.map(stats => [new Date(stats.timestamprun), stats.sumOfHumidityPer]),
    sumOfCloudiness: StatsList.map(stats => [new Date(stats.timestamprun), stats.sumOfCloudiness]),
    sumOfHCloudiness: StatsList.map(stats => [new Date(stats.timestamprun), stats.sumOfHCloudiness]),
    sumOfLCloudiness: StatsList.map(stats => [new Date(stats.timestamprun), stats.sumOfLCloudiness]),
    sumOfMCloudiness: StatsList.map(stats => [new Date(stats.timestamprun), stats.sumOfMCloudiness]),
    timeLastUpdate: StatsList.map(stats => [new Date(stats.timestamprun), new Date(stats.timestamprun - stats.timeLastUpdate)]),
    sumoftempcdiffwithmetno: StatsList.map(stats => [new Date(stats.timestamprun), stats.sumoftempcdiffwithmetno]),
    longlats: StatsList.map(stats => [new Date(stats.timestamprun), stats.longlats])
  };
  render() {

    let charts = [];
    for (let key in this.state) {
      if (key !== 'timestamprun' && key !== 'nameofapi' && key !== 'longlats') {
        console.log(typeof key, [['time', `${key}`], ...this.state[`${key}`]]);
        charts.push(<Chart
            width={'100%'}
            height={'400px'}
            chartType="LineChart"
            loader={<div>Loading Chart</div>}
            data={
              [['time', `${key}`], ...this.state[`${key}`]]
            }
            options={{
              hAxis: {
                title: 'Time',
              },
              vAxis: {
                title: 'values',
              },
            }}
            key={key}
          />
        );
      }
    }
    
    return charts;
  }
}

export default App;
