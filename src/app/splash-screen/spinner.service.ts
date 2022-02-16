import { Injectable } from '@angular/core';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { SplashScreenComponent } from './splash-screen.component';
import { Subject, Subscription } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class SpinnerService {

    hiding: Subject<any> = new Subject();
    done: Subject<any> = new Subject();
    private overlayRef: OverlayRef | undefined;
    private subscription?: Subscription;

    constructor(private overlay: Overlay) { }

    private initSubscriptions() {
        this.subscription = this.done.subscribe(() => {
            if (this.overlayRef) {
                this.overlayRef.detach();
                delete this.overlayRef;
            }
            this.cancelSubscriptions();
        });
    }

    private cancelSubscriptions() {
        this.subscription?.unsubscribe();
    }

    public show(): void {
        if (!this.overlayRef) {
            this.overlayRef = this.overlay.create();
        }
        const spinnerOverlayPortal = new ComponentPortal(SplashScreenComponent);
        this.overlayRef.attach(spinnerOverlayPortal);
    }

    public hide(): void {
        this.initSubscriptions();
        this.hiding.next(1);
    }

}
