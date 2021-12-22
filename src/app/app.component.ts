import { Component } from '@angular/core';
import { AppService } from './app.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  appService: AppService;
  showMap: boolean;
  
  constructor(appService: AppService) {
    this.appService = appService;
    this.showMap = false;
  }
}