import { Injectable, Inject, LOCALE_ID, PLATFORM_ID } from '@angular/core';
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