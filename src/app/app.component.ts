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

  createDummySeries(): any[] {
    const dummyseries: any[] = [];
    for (let i = 0; i < 6; i++) {
      dummyseries.push({
        type: 'line',
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
    series: this.createDummySeries()
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
    for (let key in values) {
      // console.log(key);
      // console.log(key, values[key]);
      series.push({
        name: key,
        type: 'line',
        visible: key === 'Tr.heim' || key === 'Oslo',
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
      series: series
    };
    this.chartOptions = options;
  }
}
