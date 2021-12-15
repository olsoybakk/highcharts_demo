import { Component } from '@angular/core';
import * as Highcharts from 'highcharts';
import { AppService } from './app.service';
import { map } from 'rxjs/operators';
import { fromEvent, Observable, Subscription } from 'rxjs';
import * as moment from 'moment';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  valueFormat: string = 'øre/kWh'
  fillDate: number = -1;
  minDate: Date | undefined;
  maxDate: Date | undefined;
  chartData: any;
  appService: AppService;
  resizeObservable$: Observable<Event>;
  resizeSubscription$: Subscription;
  areaState: any = {
    // 'Oslo': true,
    // 'Kr.Sand': false,
    // 'Bergen': false,
    // 'Tr.heim': true,
    // 'Molde': false,
    // 'Tromsø': false
  };
  
  constructor(appService: AppService) {
    this.appService = appService;
    this.resizeObservable$ = fromEvent(window, 'resize')
    this.resizeSubscription$ = this.resizeObservable$.subscribe(() => {
      setTimeout(() => {
        this.fillChart(this.chartData);
      }, 500);
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
      text: 'Nordpool - henter data...'
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
      pointFormat: `Snittpris: <b>{point.y} ${this.valueFormat}</b>`
    },
    series: this.createDummySeries('line')
  };
  
  chartOptionsExtra: Highcharts.Options = {
    title: {
      text: 'Nordpool - henter data...'
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
      pointFormat: `Snittpris: <b>{point.y} ${this.valueFormat}</b>`
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

  getStringWithLeadingZero(value: number): string {
    return `${value}`.padStart(2, '0');
  }

  getDateValueString(d: Date, separator: string = ''): string {
    if (!d) return '';
    return `${d.getFullYear()}${separator}${this.getStringWithLeadingZero(d.getMonth() + 1)}${separator}${this.getStringWithLeadingZero(d.getDate())}`;
  }
  
  getDateValue(d: Date): number {
    if (!d) return -1;
    return parseInt(`${d.getFullYear()}${d.getMonth() + 1}${d.getDate()}`);
  }
  
  getDateValueWithHour(d: Date, separator: string = ''): number {
    if (!d) return -1;
    return parseInt(`${d.getFullYear()}${separator}${d.getMonth() + 1}${separator}${d.getDate()}${separator}${d.getHours()}`);
  }

  ngOnInit(): void {
    moment.locale('nb')
    this.fillDate = (new Date()).getDate();
    const storageDatetime = localStorage.getItem('datetime');
    const storageDataString = localStorage.getItem('data');
    const areaState = localStorage.getItem('areastate');
    if (areaState) this.areaState = JSON.parse(areaState);
    if (storageDataString && storageDatetime) {
      let storageData = JSON.parse(storageDataString);
      const storagetime = new Date(storageDatetime);
      const now = new Date();
      const storageDateEnddate = new Date(storageData.data.DataEnddate);
      // console.log('data date', this.getDateValue(storageDateEnddate));
      if (this.getDateValue(storageDateEnddate) <= this.getDateValue(now) + 1) {
        if (now.getUTCHours() > 10) {
          // if ((storagetime.getTime() + 30*60*1000) < now.getTime()) {
          if ((storagetime.getTime() + 15*60*1000) < now.getTime()) {
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

  step(step: number): void {
    if (this.isDisabled(step)) return;
    this.fillDate += step;
    this.fillChart(this.chartData);
  }

  setdate(value: number): void {
    const now = new Date();
    this.fillDate = (new Date(now.setDate(now.getDate() + value))).getDate();
    this.fillChart(this.chartData);
  }

  isToday(): boolean {
    const now = new Date();
    return now.getDate() == (new Date((new Date()).setDate(this.fillDate))).getDate();
  }

  isDisabled(step: number): boolean {
    if (this.fillDate === -1) return true;
    let minDate = this.minDate;
    let maxDate = this.maxDate;
    let dateval = (new Date()).setDate(this.fillDate);
    dateval += step * 24 * 3600 * 1000;
    const validateDate = new Date(dateval);
    if (step > 0) {
      if (maxDate && maxDate.getDate() < validateDate.getDate()) {
        if (maxDate.getMonth() <= validateDate.getMonth())
          if (maxDate.getMonth() <= validateDate.getMonth()) return true;
      }
    } else {
      if (minDate && minDate.getDate() > validateDate.getDate()) {
        if (minDate.getMonth() >= validateDate.getMonth())
          if (minDate.getFullYear() >= validateDate.getFullYear()) return true;
      }
    }
    return false;
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
    let minDate: Date = new Date((new Date).getFullYear() + 1, 1);
    let maxDate: Date = new Date((new Date).getFullYear() - 1, 1);
    let current: any = {};
    const now = new Date();
    data.data.Rows.forEach((row: any, i: number) => {
      let skip = false;
      if (startTime === undefined) startTime = row.StartTime;
      const theTime = new Date(row.StartTime);
      if (this.fillDate >= 0) {
        if ((theTime.getDate() !== this.fillDate)) skip = true;
      }
      if (this.minDate === undefined || this.minDate > theTime) this.minDate = theTime;
      if (this.maxDate === undefined || this.maxDate < theTime) this.maxDate = theTime;
      if (!skip) {
        if (minDate === undefined || minDate > theTime) minDate = theTime;
        if (maxDate === undefined || maxDate < theTime) maxDate = theTime;
        let dateRow = (theTime).getTime();
        dateRow += 1 * 1000 * 3600; // convert to UTC+1
        row.Columns.forEach((column: any, j: number) => {
          if (current[column.Name] === undefined) current[column.Name] = 0;
          if (values[column.Name] === undefined) values[column.Name] = [];
          let value = Math.round(parseFloat(column.Value.replace(' ', '').replace(',', '.')) * 1.25) / 10;
          values[column.Name].push([dateRow, value]);
          values[column.Name].push([dateRow + (1000 * 3600) - 1, value]);
          if (current[column.Name] === 0
            && now > theTime
            && now.getDate() === theTime.getDate()
            && now.getHours() === theTime.getHours()
            && (now.getTime() + 1000 * 3599) > theTime.getTime()) {
            current[column.Name] = value;
          }
        });
      }
    });
    // console.log('values', values);
    // console.log('current', current);
    const series: any[] = [];
    const seriesExtra: any[] = [];
    const self = this;
    for (let key in values) {
      let visible = key === 'Tr.heim' || key === 'Oslo';
      if (this.areaState.hasOwnProperty(key)) {
        visible = this.areaState[key];
      } else {
        this.areaState[key] = visible;
      }
      // console.log(key);
      // console.log(key, values[key]);
      series.push({
        name: key,
        type: 'line',
        visible: visible,
        data: values[key].sort((a:any[],b:any[]) => a[0] - b[0]),
        events: {
          legendItemClick: () => {
            //console.log(key, self.areaState[key]);
            self.areaState[key] = !self.areaState[key];
            localStorage.setItem('areastate', JSON.stringify(self.areaState));
          }
        }
      });
      seriesExtra.push([key, Math.round(values[key].reduce((sum: number, x: number[]) => sum + x[1], 0) / values[key].length)]);
    }
    // console.log('series', series);
    // console.log('seriesExtra', seriesExtra);

    const dateValue = minDate.getDate() === maxDate.getDate()
      ? `${this.getDateValueString(minDate, '.')}`
      : `${this.getDateValueString(minDate, '.')} - ${this.getDateValueString(maxDate, '.')}`;

    let options: Highcharts.Options = {
      chart: {
        zoomType: 'x',
        height: Math.round(window.innerHeight * 5 / 8),
        width: window.innerWidth
      },
      title: {
        // text: `Nordpool strømpriser - ${data.header.title} ${(new Date(data.data.LatestResultDate)).toLocaleString()}`
        text: `Nordpool strømpriser (${dateValue})`
      },
      xAxis: {
        type: 'datetime',
        dateTimeLabelFormats: { // don't display the dummy year
          month: '%m',
          year: '%Y'
        },
        title: {
          text: 'Dato'
        },
        plotLines: [{
          color: '#FF0000',
          // dashStyle: 'LongDash',
          dashStyle: 'LongDash',
          width: 1,
          value: (new Date()).getTime() + 1000*3600
        }]
      },
      yAxis: {
        title: {
          // text: `Electric rate (${data.data.Units})`
          text: `Strømpris (${this.valueFormat})`
        },
        // min: minValue
      },
      plotOptions: {
        series: {
          marker: {
              enabled: false
          }
        }
      },
      legend: {
        // layout: 'vertical',
        // align: 'left',
        // floating: true,
        // verticalAlign: 'top',
        // x: 60,
        // y: 45,
        // borderColor: 'rgba(100,100,100,0.5)',
        // borderWidth: 1,
        // padding: 10,
        // margin: 50,
        // itemMarginTop: 5,
        // itemMarginBottom: 5,
        // //backgroundColor: '#FFFFFF'
        // backgroundColor: 'rgba(255,255,255,0.8)',
        // useHTML: true,
        labelFormatter: function () {
          let label = this.name;
          if (current[this.name] > 0) label += ` (${current[this.name]} ${self.valueFormat})`;
          return label;
        }
      },
      // colors: ['#6CF', '#39F', '#06C', '#036', '#000', '#F00'],
      // series: [series[3]]
      tooltip: {
        formatter: function () {
          // console.log(this);
          return `<span style='font-size: 10px;'>${moment(this.x - 1000 * 3600).format('LLLL')}</span><br/><span style='color: ${this.color};'>●</span> ${this.series.name}: <b>${Highcharts.numberFormat(this.y, 2)} ${self.valueFormat}</b>`;
        }
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
        // text: `Nordpool strømpriser - ${data.header.title} ${(new Date(data.data.LatestResultDate)).toLocaleString()}`
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
              text: `Snittpris (${this.valueFormat})`
          }
      },
      legend: {
          enabled: false
      },
      tooltip: {
        pointFormat: `Snittpris: <b>{point.y} ${this.valueFormat}</b>`
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
          format: `{point.y} ${this.valueFormat}`,
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
