import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { MapComponent } from './map/map.component';
import { NordpoolComponent } from './nordpool/nordpool.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { MatCommonModule } from '@angular/material/core';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule, DateAdapter } from '@angular/material/core';
import { HighchartsChartModule } from 'highcharts-angular';
import { CustomDateAdapter } from 'src/adapter/custom.date.adapter';

@NgModule({
    declarations: [
        AppComponent,
        MapComponent,
        NordpoolComponent
    ],
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        HttpClientModule,
        MatCommonModule,
        MatMenuModule,
        MatButtonModule,
        MatIconModule,
        MatListModule,
        MatDatepickerModule,
        MatSelectModule,
        MatInputModule,
        MatNativeDateModule,
        HighchartsChartModule
    ],
    providers: [{
        provide: DateAdapter,
        useClass: CustomDateAdapter
    }],
    bootstrap: [AppComponent]
})
export class AppModule { }
