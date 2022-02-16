import { Component, OnInit } from '@angular/core';
import { SpinnerService } from './spinner.service';

@Component({
    selector: 'app-splash-screen',
    templateUrl: './splash-screen.component.html',
    styleUrls: ['./splash-screen.component.scss']
})
export class SplashScreenComponent implements OnInit {

    opacity = 1;
    private interval: any;

    constructor(private spinnerService: SpinnerService) { }

    ngOnInit(): void {
        this.spinnerService.hiding.subscribe(() => {
            this.interval = setInterval(() => {
                this.decrementOpacity();
            }, 10);
        });
    }

    decrementOpacity() {
        this.opacity += -0.01;
        if (this.opacity <= 0) {
            clearInterval(this.interval);
            this.spinnerService.done.next(1);
        }
    }

}
