import React from "react";
import { Bar, Line } from "react-chartjs-2";
class Chart extends React.Component {
  render() {
    return (
      <div className="chart">
        <div className="leftChart">
          <Line
            data={this.props.data.tempChartData}
            height="auto"
            width="auto"
            options={{
              title: {
                display: true,
                text: "Sum of Temperature & Wind",
                fontSize: 25,
                fontColor: "white"
              },
              legend: {
                display: true,
                position: "right"
              },
              scales: {
                yAxes: [
                  {
                    ticks: {
                      beginAtZero: true
                    }
                  }
                ]
              }
            }}
          />
        </div>
        <div className="rightChart">
          <Line
            data={this.props.data.pressureChartData}
            options={{
              title: {
                display: true,
                text: "Sum of Pressure",
                fontSize: 25,
                fontColor: "white"
              },
              legend: {
                display: true,
                position: "right"
              },
              scales: {
                yAxes: [
                  {
                    ticks: {
                      beginAtZero: true
                    }
                  }
                ]
              }
            }}
          />
        </div>
        <div className="leftChart">
          <Bar
            data={this.props.data.cityChartData}
            options={{
              title: {
                display: true,
                text: "Number of Cities",
                fontSize: 25,
                fontColor: "white"
              },
              legend: {
                display: true,
                position: "right"
              },
              scales: {
                yAxes: [
                  {
                    ticks: {
                      beginAtZero: true
                    }
                  }
                ]
              }
            }}
          />
        </div>
        <div className="rightChart">
          <Bar
            data={this.props.data.temperatureDifferenceData}
            options={{
              title: {
                display: true,
                text: "Temperature difference ",
                fontSize: 25,
                fontColor: "white"
              },
              legend: {
                display: true,
                position: "right"
              },
              scales: {
                yAxes: [
                  {
                    ticks: {
                      beginAtZero: true
                    }
                  }
                ]
              }
            }}
          />
        </div>
      </div>
    );
  }
}
export default Chart;
