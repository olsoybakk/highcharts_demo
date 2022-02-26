import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class AppService {

    private avgPrice: any = {};
    private currPrice: any = {};

    constructor() { }

    getAvgPrice(name: string): number {
        return this.avgPrice[name];
    }

    setAvgPrice(name: string, value: number ) {
        // console.log('average', name, value);
        this.avgPrice[name] = value;
    }

    getCurrPrice(name: string): number {
        return this.currPrice[name];
    }

    setCurrPrice(name: string, value: number ) {
        // console.log('current', name, value);
        if (value > 0) {
            this.currPrice[name] = value;
        }
    }

}
