import { Component } from '@angular/core';
import { FormControl } from '@angular/forms';
import * as Highcharts from 'highcharts';
import { map } from 'rxjs/operators';
import { fromEvent, Observable, Subscription } from 'rxjs';
import * as moment from 'moment';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';
import { NordpoolService } from './nordpool.service';
import { INordpoolOptions, INordpoolRange, INordpoolRangeValue } from './nordpool.options';
import { MatSelectChange } from '@angular/material/select';
import { SpinnerService } from '../splash-screen/spinner.service';

@Component({
    selector: 'app-nordpool',
    templateUrl: './nordpool.component.html',
    styleUrls: ['./nordpool.component.scss']
})
export class NordpoolComponent {

    valueFormat: string = 'øre/kWh'
    datepickerDate: Date | undefined;
    fillDate: number = -1;
    minDate: Date | undefined;
    maxDate: Date | undefined;
    chartData: any;
    nordpoolService: NordpoolService;
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
    ranges: INordpoolRange[];

    constructor(
        nordpoolService: NordpoolService,
        private spinnerService: SpinnerService
    ) {

        this.ranges = [{ value: { startDate: this.minDate, endDate: this.maxDate }, viewValue: 'Vis Alle' }];

        Highcharts.setOptions({
            chart: {
                backgroundColor: '#212121',
                borderColor: '#EEEEEE'
            },
            colors: [
                // '#7cb5ec',
                // '#434348',
                // '#90ed7d',
                // '#f7a35c',
                // '#8085e9',
                // '#f15c80',
                // '#e4d354',
                // '#2b908f',
                // '#f45b5b',
                // '#91e8e1'
                '#7cb5ec',
                '#e4d354', // '#434348',
                '#90ed7d',
                '#f7a35c',
                '#8085e9',
                '#f15c80',
                // '#e4d354',
                '#2b908f',
                '#f45b5b',
                '#91e8e1'
            ],
            credits: {
                enabled: false
            },
            legend: {
                itemHiddenStyle: {
                    color: '#999999',
                },
                itemHoverStyle: {
                    color: '#EEEEEE'
                },
                itemStyle: {
                    color: '#BBBBBB'
                }
            },
            plotOptions: {
                line: {
                    states: {
                        inactive: {
                            opacity: 0.7
                        }
                    },
                    marker: {
                        // lineColor: '#BBBBBB'
                    }
                }
            },
            title: {
                style: {
                    color: '#BBBBBB'
                }
            },
            xAxis: {
                labels: {
                    style: {
                        color: '#BBBBBB'
                    }
                },
                title: {
                    style: {
                        color: '#BBBBBB'
                    }
                }
            },
            yAxis: {
                labels: {
                    style: {
                        color: '#BBBBBB'
                    }
                },
                title: {
                    style: {
                        color: '#BBBBBB'
                    }
                }
            }
        });
        // console.log('theme', Highcharts.getOptions());

        // const currentYear = new Date().getFullYear();
        // this.minDate = new Date(currentYear - 20, 0, 1);
        // this.maxDate = new Date(currentYear + 1, 11, 31);

        this.nordpoolService = nordpoolService;
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

    datepicked(event: MatDatepickerInputEvent<Date>): void {
        if (!event.value) return;
        this.datepickerDate = event.value;
        this.fillDate = event.value.getDate();
        this.fillChart(this.chartData);
    }

    getSelected(): INordpoolRangeValue {
        if (this.fillDate === -1) return this.ranges[0].value;
        const range = this.ranges.filter(r => this.fillDate === r.value.startDate?.getDate());
        // console.log('selected', range);
        return range[range.length - 1].value;
    }

    selectedRange(event: MatSelectChange): void {
        if (!event.value) return;
        const value: INordpoolRangeValue = event.value;
        if (value.startDate && value.endDate) {
            this.datepickerDate = undefined;
            this.fillDate = -1;
            this.fillChart(this.chartData);
        } else if (value.startDate) {
            this.datepickerDate = value.startDate;
            this.fillDate = value.startDate.getDate();
            this.fillChart(this.chartData);
        }
    }

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
                { name: '', x: 1 },
                { name: '', x: 2 },
                { name: '', x: 3 },
                { name: '', x: 4 },
                { name: '', x: 5 },
                { name: '', x: 6 }
            ]
        }]
    };

    getStringWithLeadingZero(value: number): string {
        return `${value}`.padStart(2, '0');
    }

    getDateValueString(d: Date | undefined, separator: string = ''): string {
        if (!d) return '';
        // return `${d.getFullYear()}${separator}${this.getStringWithLeadingZero(d.getMonth() + 1)}${separator}${this.getStringWithLeadingZero(d.getDate())}`;
        return moment(d).format('L');
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
        this.spinnerService.show();
        moment.locale('nb');
        this.datepickerDate = new Date();
        this.fillDate = this.datepickerDate.getDate();
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
                    if ((storagetime.getTime() + 15 * 60 * 1000) < now.getTime()) {
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
        this.nordpoolService.getData(`${proxyUrl}${encodeURIComponent(url)}`)
            .subscribe(data => {
                if (data) {
                    this.fillChart(data);
                } else {
                    this.nordpoolService.getData('assets/23.json')
                        .subscribe(data => {
                            if (data) this.fillChart(data);
                        });
                }
            });
    }

    showall(): void {
        this.fillDate = -1;
        this.datepickerDate = undefined;
        this.fillChart(this.chartData);
    }

    step(step: number): void {
        if (this.isDisabled(step)) return;
        if (!this.datepickerDate) return;
        // console.log('step', step, this.datepickerDate);
        this.datepickerDate = new Date(this.datepickerDate.setDate(this.datepickerDate.getDate() + step));
        // this.fillDate += step;
        this.fillDate = (this.datepickerDate).getDate();
        this.fillChart(this.chartData);
    }

    setdate(value: number): void {
        const now = new Date();
        // console.log('setdate', value, this.datepickerDate);
        this.datepickerDate = new Date(now.setDate(now.getDate() + value));
        this.fillDate = (this.datepickerDate).getDate();
        this.fillChart(this.chartData);
    }

    isToday(): boolean {
        const now = new Date();
        return now.getDate() == (new Date((new Date()).setDate(this.fillDate))).getDate();
    }

    isDisabled(step: number): boolean {
        // if (step === -1) console.log('step', step);
        // if (step === -1) console.log('filldate', this.fillDate);
        if (this.fillDate === -1) return true;
        let minDate = this.minDate;
        let maxDate = this.maxDate;
        let dateval = (new Date()).setDate(this.fillDate);
        dateval += step * 24 * 3600 * 1000;
        const validateDate = new Date(dateval);
        if (step > 0) {
            if (maxDate && maxDate.getDate() < validateDate.getDate()) {
                if (maxDate.getMonth() <= validateDate.getMonth())
                    // if (step === -1) console.log('step1\n', maxDate, '\n', validateDate);
                    if (maxDate.getMonth() <= validateDate.getMonth()) return true;
            }
        } else {
            if (minDate && minDate.getDate() > validateDate.getDate()) {
                if (minDate.getMonth() >= validateDate.getMonth())
                    // if (step === -1) console.log('step2\n', minDate, '\n', validateDate);
                    if (minDate.getFullYear() >= validateDate.getFullYear()) return true;
                // if (step === -1) console.log('step3\n', minDate.getFullYear() >= validateDate.getFullYear());
            }
        }
        return false;
    }

    fillChart(d: any): void {
        setTimeout(() => {
            this.spinnerService.hide();
        }, 100);
        // console.log('d', typeof d, d.length, d);
        let data = typeof d === 'object' ? d : JSON.parse(d);
        if (typeof d === 'object' && d.result) data = JSON.parse(d.result);

        localStorage.setItem('datetime', (new Date()).toUTCString());
        localStorage.setItem('data', JSON.stringify(data));

        this.chartData = data;

        // console.log('data', data);
        // console.log(data.data.Rows.forEach((row: any, i: number) => console.log(i,row.Columns)));
        // console.log(this.chartOptions);

        const nordpoolOptions: INordpoolOptions = {
            fillDate: this.fillDate,
            minDate: undefined, // this.minDate,
            maxDate: undefined, // this.maxDate
        };

        const result = this.nordpoolService.generateData(data.data.Rows, nordpoolOptions);

        this.minDate = result.options.minDate;
        this.maxDate = result.options.maxDate;
        const minDate = result.minDate;
        const maxDate = result.maxDate;
        this.ranges = result.ranges;

        // console.log('values', result.values);
        // console.log('current', result.current);
        const series: any[] = [];
        const seriesExtra: any[] = [];
        const self = this;
        for (let key in result.values) {
            let visible = key === 'Tr.heim';// || key === 'Oslo' || key === 'Tromsø';
            if (this.areaState.hasOwnProperty(key)) {
                visible = this.areaState[key];
            } else {
                this.areaState[key] = visible;
            }
            // console.log(key);
            // console.log(key, result.values[key]);
            series.push({
                name: key,
                type: 'line',
                visible: visible,
                data: result.values[key].sort((a: any[], b: any[]) => a[0] - b[0]),
                events: {
                    legendItemClick: () => {
                        //console.log(key, self.areaState[key]);
                        self.areaState[key] = !self.areaState[key];
                        localStorage.setItem('areastate', JSON.stringify(self.areaState));
                    }
                }
            });
            seriesExtra.push([key, Math.round(100 * result.values[key].reduce((sum: number, x: number[]) => sum + x[1], 0) / result.values[key].length) / 100]);
        }
        // console.log('series', series);
        // console.log('seriesExtra', seriesExtra);

        const dateValue = minDate?.getDate() === maxDate?.getDate()
            ? ` (${this.getDateValueString(minDate, '.')})`
            // ? ` (${this.getDateValueString(maxDate, '.')})`
            : ` (${this.getDateValueString(minDate, '.')} - ${this.getDateValueString(maxDate, '.')})`;
        // : ` (${this.getDateValueString(maxDate, '.')})`;

        let options: Highcharts.Options = {
            chart: {
                // zoomType: 'x',
                height: Math.round(window.innerHeight * 5 / 8),
                width: window.innerWidth
            },
            title: {
                // text: `Nordpool strømpriser - ${data.header.title} ${(new Date(data.data.LatestResultDate)).toLocaleString()}`
                text: `Nordpool strømpriser${dateValue}`
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
                    value: (new Date()).getTime() + 1000 * 3600
                }]
            },
            yAxis: {
                title: {
                    // text: `Electric rate (${data.data.Units})`
                    text: `Strømpris (${this.valueFormat})`
                }
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
                    if (result.current[this.name] > 0) label += ` (${result.current[this.name]} ${self.valueFormat})`;
                    return label;
                }
            },
            // colors: ['#6CF', '#39F', '#06C', '#036', '#000', '#F00'],
            // series: [series[3]]
            tooltip: {
                useHTML: true,
                formatter: function () {
                    // console.log(this);
                    const datas: Highcharts.Point[][] = [];
                    // this.series.chart.series.forEach(s => datas.push(s.data.filter(e => e.series.visible && `${e.category}` === `${this.key}`)));
                    this.series.chart.series.forEach(s => datas.push(s.data.filter(e => `${e.category}` === `${this.key}`)));
                    let tooltip = `<div style='font-size: 10px;'>${moment(this.x - 1000 * 3600).format('LLLL')}</div>`;
                    // tooltip += `<br/>`;
                    let seriestooltip = '';
                    // console.log('datas', datas);
                    datas.forEach(c => c.forEach(d => {
                        // if (seriestooltip.length > 0) seriestooltip += '<br/>';
                        seriestooltip += '<div>';
                        seriestooltip += `<div style='display: inline-flex; width: 160px;'>`;
                        seriestooltip += `<div style='width: 65px; border: red 1px;'>`;
                        // seriestooltip += `<div style='width: 150px;'>`;
                        seriestooltip += `<span style='color: ${d.color};'>●</span>`;
                        seriestooltip += this.colorIndex === d.colorIndex
                            ? `&nbsp;<span style='font-weight: bold; font-size:1.1em;'>${d.series.name}:</span>&nbsp;`
                            : `&nbsp;${d.series.name}:&nbsp;`;
                        seriestooltip += '</div>';
                        seriestooltip += `<div style='text-align: right; width: 195px; border: red 1px;'>`;
                        seriestooltip += `<b>${Highcharts.numberFormat(d.y || 0, 1)} ${self.valueFormat}</b>`;
                        seriestooltip += '</div>';
                        seriestooltip += '</div>';
                        seriestooltip += '</div>';
                    }));
                    tooltip += seriestooltip;
                    return tooltip;
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
