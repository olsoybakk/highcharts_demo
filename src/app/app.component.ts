import { Component } from '@angular/core';
import * as Highcharts from 'highcharts';
import { AppService } from './app.service';
import { map } from 'rxjs/operators';
import { fromEvent, Observable, Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  fillDate: number = -1;
  chartData: any;
  appService: AppService;
  resizeObservable$: Observable<Event>;
  resizeSubscription$: Subscription
  
  constructor(appService: AppService) {
    this.appService = appService;
    this.resizeObservable$ = fromEvent(window, 'resize')
    this.resizeSubscription$ = this.resizeObservable$.subscribe(() => {
      this.fillChart(this.chartData);
    });
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

  getDateValue(d: Date): number {
    if (!d) return -1;
    let stringValue = `${d.getFullYear()}${d.getMonth()}${d.getDate()}`;
    return parseInt(stringValue);
  }
  
  getDateValueWithHour(d: Date): number {
    if (!d) return -1;
    let stringValue = `${d.getFullYear()}${d.getMonth()}${d.getDate()}${d.getHours()}`;
    return parseInt(stringValue);
  }

  ngOnInit(): void {
    this.fillDate = (new Date()).getDate();
    const storageDatetime = localStorage.getItem('datetime');
    const storageDataString = localStorage.getItem('data');
    if (storageDataString && storageDatetime) {
      let storageData = JSON.parse(storageDataString);
      const storagetime = new Date(storageDatetime);
      const now = new Date();
      const storageDateEnddate = new Date(storageData.data.DataEnddate);
      // console.log('data date', this.getDateValue(storageDateEnddate));
      if (this.getDateValue(storageDateEnddate) <= this.getDateValue(now) + 1) {
        if (now.getUTCHours() > 11) {
          if ((storagetime.getTime() + 30*60*1000) < now.getTime()) {
            storageData = null;
          }
        }
      }
      if (storageData) {
        this.fillChart(storageData);
        return;
      }
    }

    const proxyUrl = 'https://proxy20211210131237.azurewebsites.net/proxy/get/?url=';
    const url = 'https://www.nordpoolgroup.com/api/marketdata/chart/23?currency=NOK';
    this.appService.getData(`${proxyUrl}${encodeURIComponent(url)}`)
    .subscribe(data => {
      if (data) {
        this.fillChart(data);
      } else {
        this.appService.getData('assets/23.json')
        .subscribe(data => {
          if (data) this.fillChart(data);
        });
      }
    });
  }

  showall(): void {
    this.fillDate = -1;
    this.fillChart(this.chartData);
  }

  showstep(step: number): void {
    this.fillDate += step;
    this.fillChart(this.chartData);
  }

  showdate(value: number): void {
    const now = new Date();
    this.fillDate = (new Date(now.setDate(now.getDate() + value))).getDate();
    this.fillChart(this.chartData);
  }

  fillChart(d: any): void {
    // console.log('d', typeof d, d.length, d);
    let data = typeof d === 'object' ? d : JSON.parse(d);
    if (typeof d === 'object' && d.result) data = JSON.parse(d.result);

    localStorage.setItem('datetime', (new Date()).toUTCString());
    localStorage.setItem('data', JSON.stringify(data));

    this.chartData = data;

    // console.log('data', data);
    // console.log(data.data.Rows.forEach((row: any, i: number) => console.log(i,row.Columns)));
    // console.log(this.chartOptions);
    const values: any = {};
    let startTime: Date;
    data.data.Rows.forEach((row: any, i: number) => {
      let skip = false;
      if (startTime === undefined) startTime = row.StartTime;
      if (this.fillDate >= 0) {
        if ((new Date(row.StartTime).getDate() !== this.fillDate)) skip = true;
      }
      if (!skip) {
        let dateRow = (new Date(row.StartTime)).getTime();
        dateRow += 2 * 1000 * 3600; // convert to UTC+2
        // let dateRow = row.StartTime;
        row.Columns.forEach((column: any, j: number) => {
          if (values[column.Name] === undefined) values[column.Name] = [];
          let value = Math.round(parseFloat(column.Value.replace(' ', '').replace(',', '.')) * 1.25 / 10);// /100;
          // values[column.Name].unshift([dateRow, value]);
          values[column.Name].push([dateRow, value]);
        });
      }
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
        zoomType: 'x',
        height: Math.round(window.innerHeight * 5 / 8),
        width: window.innerWidth
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
        type: 'column',
        height: Math.round(window.innerHeight / 4),
        width: window.innerWidth
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