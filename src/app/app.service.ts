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

    reset(): void {
        console.log('reset');
        localStorage.clear();
        const cookies = document.cookie.split(';');
        for (var i = 0; i < cookies.length; i++) {
            var cookie = cookies[i];
            var eqPos = cookie.indexOf("=");
            var name = eqPos > -1 ? cookie.substring(0, eqPos) : cookie;
            document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
        }
        window.location.reload();
    }

}
