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