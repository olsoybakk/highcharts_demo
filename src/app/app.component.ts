import { Component } from '@angular/core';
import * as Highcharts from 'highcharts';
import { AppService } from './app.service';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  appService: AppService;
  
  constructor(appService: AppService) {
    this.appService = appService;
  }

  title = 'Highcharts demo';
  Highcharts: typeof Highcharts = Highcharts;
  HighchartsExtra: typeof Highcharts = Highcharts;

  createDummySeries(type: string): any[] {
    const dummyseries: any[] = [];
    for (let i = 0; i < 6; i++) {
      dummyseries.push({
        type: type,
        name: '',
        visible: false
      });
    }
    return dummyseries;
  }
  chartOptions: Highcharts.Options = {
    title: {
      text: 'Nordpool data - harvesting data...'
    },
    xAxis: {
      title: {
        text: ''
      }
    },
    yAxis: {
      title: {
        text: ''
      }
    },
    tooltip: {
      pointFormat: 'Electric rate: <b>{point.y} øre</b>'
    },
    series: this.createDummySeries('line')
  };
  
  chartOptionsExtra: Highcharts.Options = {
    title: {
      text: 'Nordpool data - harvesting data...'
    },
    xAxis: {
      type: 'category',
      labels: {
          rotation: -45,
          style: {
              fontSize: '13px',
              fontFamily: 'Verdana, sans-serif'
          }
      }
    },
    yAxis: {
        min: 0,
        title: {
            text: ''
        }
    },
    legend: {
        enabled: false
    },
    tooltip: {
      pointFormat: 'Average electric rate: <b>{point.y} øre</b>'
    },
    // series: this.createDummySeries('column')
    series: [{
      type: 'column',
      data: [
        {name: '', x: 1},
        {name: '', x: 2},
        {name: '', x: 3},
        {name: '', x: 4},
        {name: '', x: 5},
        {name: '', x: 6}
      ]
    }]
  };

  ngOnInit(): void {
    const url = 'https://www.nordpoolgroup.com/api/marketdata/chart/23?currency=NOK';
    this.appService.getData('assets/23.json')
    .subscribe(data => {
      this.fillChart(data);
      this.appService.getData(url)
      .subscribe(data => {
        if (data) {
          this.fillChart(data);
        } else {
          this.appService.getData(`https://thingproxy.freeboard.io/fetch/${url}`)
          .subscribe(data => {
            if (data) this.fillChart(data);
          });
        }
      });
    });
  }

  fillChart(d: string): void {
    // console.log('d', typeof d, d.length, d);
    let data = typeof d === 'object' ? d : JSON.parse(d);
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
        let value = Math.round(parseFloat(column.Value.replace(' ', '').replace(',', '.')) * 1.25 / 10);// /100;
        // values[column.Name].unshift([dateRow, value]);
        values[column.Name].push([dateRow, value]);
      });
    });
    // console.log('values', values);
    const series: any[] = [];
    const seriesExtra: any[] = [];
    for (let key in values) {
      // console.log(key);
      // console.log(key, values[key]);
      series.push({
        name: key,
        type: 'line',
        visible: key === 'Tr.heim' || key === 'Oslo',
        data: values[key].sort((a:any[],b:any[]) => a[0] - b[0])
      });
      seriesExtra.push([key, Math.round(values[key].reduce((sum: number, x: number[]) => sum + x[1], 0) / values[key].length)]);
    }
    // console.log('series', series);
    // console.log('seriesExtra', seriesExtra);

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
          // text: `Electric rate (${data.data.Units})`
          text: `Electric rate (øre/kWh)`
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
      // colors: ['#6CF', '#39F', '#06C', '#036', '#000', '#F00'],
      // series: [series[3]]
      tooltip: {
        pointFormat: 'Electric rate: <b>{point.y} øre</b>'
      },
      series: series
    };
    let optionsExtra: Highcharts.Options = {
      chart: {
        type: 'column'
      },
      title: {
        // text: `Nordpool data - ${data.header.title} ${(new Date(data.data.LatestResultDate)).toLocaleString()}`
        text: ''
      },
      xAxis: {
        type: 'category',
        labels: {
            rotation: -45,
            style: {
                fontSize: '13px',
                fontFamily: 'Verdana, sans-serif'
            }
        }
      },
      yAxis: {
          min: 0,
          title: {
              text: 'Average rate (øre/kWh)'
          }
      },
      legend: {
          enabled: false
      },
      tooltip: {
        pointFormat: 'Average electric rate: <b>{point.y} øre</b>'
      },
      series: [{
        type: 'column',
        // name: 'Average price',
        colorByPoint: true,
        dataLabels: {
          enabled: true,
          rotation: -90,
          color: '#FFFFFF',
          align: 'right',
          // format: '{point.y:.0f}', // one decimal
          format: '{point.y} øre',
          y: 10, // 10 pixels down from the top
          style: {
              fontSize: '13px',
              fontFamily: 'Verdana, sans-serif'
          }
        },
        data: seriesExtra
      }]
    };
    this.chartOptions = options;
    this.chartOptionsExtra = optionsExtra;
  }
}
