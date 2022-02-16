import { Injectable } from '@angular/core';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { SplashScreenComponent } from './splash-screen.component';

@Injectable({
    providedIn: 'root'
})
export class SpinnerService {

    private overlayRef: OverlayRef | undefined;
    private isVisible: boolean = false;

    constructor(private overlay: Overlay) { }

    public show(): void {
        if (!this.overlayRef) {
            this.overlayRef = this.overlay.create();
        }
        // console.log("show spinner");
        const spinnerOverlayPortal = new ComponentPortal(SplashScreenComponent);
        this.overlayRef.attach(spinnerOverlayPortal);
    }

    public hide(): void {
        if (this.overlayRef) {
            // console.log("hide spinner");
            this.overlayRef.detach();
            delete this.overlayRef;
        }
    }
}
