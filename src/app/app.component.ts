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
    title: string = 'Highcharts demo';

    constructor(
        appService: AppService,
    ) {
        this.appService = appService;
        this.showMap = false;
    }

    ngOnInit(): void {
        let cc = window as any;
        cc.cookieconsent.initialise({
            palette: {
                popup: {
                    background: "#ccc"
                },
                button: {
                    background: "#424242",
                    text: "#ccc"
                }
            },
            theme: "classic",
            content: {
                message: 'Denne siden lagrer data i nettleseren for å begrense datatrafikk', // this.cookieMessage,
                dismiss: 'Ok', // this.cookieDismiss,
                link: '', // this.cookieLinkText,
                // href: 'href' // environment.Frontend + "/dataprivacy" 
            }
        });
    }

    reset(): void {
        this.appService.reset();
    }
}