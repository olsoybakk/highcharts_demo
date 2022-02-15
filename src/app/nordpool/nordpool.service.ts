import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import * as moment from 'moment';
import { INordpoolOptions, INordpoolRange, INordpoolRangeValue, INordpoolResult } from './nordpool.options';

@Injectable({
    providedIn: 'root'
})

export class NordpoolService {

    constructor(private http: HttpClient) { }

    getData(url: string) {
        // return this.http.get<any>(url, { headers: { mode: 'no-cors', 'Access-Control-Allow-Origin': '*' } }).pipe(
        return this.http.get<any>(url).pipe(
            catchError(() => {
                return of(null);
            }),
            map(result => {
                return result;
            })
        );
    }

    generateData(rows: any[], options: INordpoolOptions) : INordpoolResult {
        const now = new Date();
        let startTime: Date;
        let minDate: Date = new Date(now.getFullYear() + 1, 1);
        let maxDate: Date = new Date(now.getFullYear() - 1, 1);
        const current: any = {};
        const values: any = {};
        rows.forEach((row: any, i: number) => {
            let skip = false;
            if (startTime === undefined) startTime = row.StartTime;
            const theTime = new Date(row.StartTime);
            if (options.fillDate >= 0) {
                if ((theTime.getDate() !== options.fillDate)) skip = true;
            }
            if (options.minDate === undefined || options.minDate > theTime) options.minDate = theTime;
            if (options.maxDate === undefined || options.maxDate < theTime) options.maxDate = theTime;
            if (!skip) {
                if (minDate === undefined || minDate > theTime) minDate = theTime;
                if (maxDate === undefined || maxDate < theTime) maxDate = theTime;
                let dateRow = (theTime).getTime();
                dateRow += 1 * 1000 * 3600; // convert to UTC+1
                row.Columns.forEach((column: any, j: number) => {
                    if (current[column.Name] === undefined) current[column.Name] = 0;
                    if (values[column.Name] === undefined) values[column.Name] = [];
                    let tax = 1.25;
                    if (column.Name == 'Tromsø') {
                        tax = 1.0;
                    }
                    let value = Math.round(parseFloat(column.Value.replace(' ', '').replace(',', '.')) * tax) / 10;
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

        const ranges: INordpoolRange[] = [{value: {startDate: minDate, endDate: maxDate}, viewValue: 'Vis Alle'}];

        if (options.minDate && options.maxDate) {
            for (let i = options.minDate.getDate(); i <= options.maxDate.getDate(); i++) {
                const theDate = new Date(minDate.setDate(i));
                ranges.push({value: {startDate: theDate, endDate: undefined}, viewValue: moment(theDate).format('L')});
            }
        }

        // console.log('options', options);

        const result = {
            current: current,
            values: values,
            minDate: minDate,
            maxDate: maxDate,
            options: options,
            ranges: ranges
        };
        // console.log('result', result);
        return result;
    }
}
