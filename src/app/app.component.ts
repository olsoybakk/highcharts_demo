import { Component } from '@angular/core';
import * as Highcharts from 'highcharts';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'Highcharts demo';
  Highcharts: typeof Highcharts = Highcharts;

  chartOptions: Highcharts.Options = {
    series: [
      {
        type: "line",
        data: []
      },
      {
        type: "line",
        data: []
      },
      {
        type: "line",
        data: []
      },
      {
        type: "line",
        data: []
      },
      {
        type: "line",
        data: []
      },
      {
        type: "line",
        data: []
      }
    ]
  };

  ngOnInit(): void {
    fetch('https://thingproxy.freeboard.io/fetch/https://www.nordpoolgroup.com/api/marketdata/chart/23?currency=NOK')
    .then(response => response.text())
    .then(d => {
      // console.log('d', typeof d, d.length);
      let data = JSON.parse(d);
      // console.log('data', data);
      // console.log(data.data.Rows.forEach((row: any, i: number) => console.log(i,row.Columns)));
      // console.log(this.chartOptions);
      const values: any = {};
      let startTime: Date;
      data.data.Rows.forEach((row: any, i: number) => {
        if (startTime === undefined) startTime = row.StartTime;
        let dateRow = (new Date(row.StartTime)).getTime();
        // let dateRow = row.StartTime;
        row.Columns.forEach((column: any, j: number) => {
          if (values[column.Name] === undefined) values[column.Name] = [];
          let value = parseFloat(column.Value.replace(' ', '').replace(',', '.'));
          // values[column.Name].unshift([dateRow, value]);
          values[column.Name].push([dateRow, value]);
        });
      });
      // console.log('values', values);
      const series: any[] = [];
      for (var key in values) {
        // console.log(key);
        // console.log(key, values[key]);
        series.push({
          name: key,
          type: 'line',
          data: values[key].sort((a:any[],b:any[]) => a[0] - b[0])
        });
      }
      // console.log('series', series);

      let options: Highcharts.Options = {
        chart: {
          zoomType: 'x'
        },
        title: {
          text: `Nordpool data - ${data.header.title} ${(new Date(data.data.LatestResultDate)).toLocaleString()}`
        },
        xAxis: {
          type: 'datetime',
          dateTimeLabelFormats: { // don't display the dummy year
            month: '%m',
            year: '%Y'
          },
          title: {
              text: 'Date'
          }
        },
        yAxis: {
            title: {
                text: `Electric rate (${data.data.Units})`
            },
            min: 0
        },
        plotOptions: {
          series: {
            marker: {
                enabled: false
            }
          }
        },
        // colors: ['#6CF', '#39F', '#06C', '#036', '#000'],
        // series: [series[3]]
        series: series
      };
      this.chartOptions = options;

    });
  }
}
