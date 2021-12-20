import { Injectable } from '@angular/core';
import { NativeDateAdapter } from '@angular/material/core';

@Injectable()
export class CustomDateAdapter extends NativeDateAdapter {
    constructor() {
        super('nb-NO');
    }
    getFirstDayOfWeek(): number {
        return 1;
    }
}