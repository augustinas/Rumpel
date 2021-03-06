import { Component, Inject, NgZone, OnInit, ViewChild } from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';
import { APP_CONFIG, AppConfig } from '../../app.config';
import {NavigationExtras, Params, Router} from '@angular/router';
import { AuthService } from '../services/auth.service';
import { HatApplication } from '../../explore/hat-application.interface';

const SMALL_SCREEN_BREAKPOINT = 720;

@Component({
  selector: 'rum-private-space',
  templateUrl: './private-space.component.html',
  styleUrls: ['./private-space.component.scss']
})
export class PrivateSpaceComponent implements OnInit {
  @ViewChild('sidenav') sideNav: MatSidenav;

  private mediaMatcher: MediaQueryList = matchMedia(`(max-width: ${SMALL_SCREEN_BREAKPOINT}px)`);

  constructor(@Inject(APP_CONFIG) private config: AppConfig,
              private authSvc: AuthService,
              private router: Router,
              zone: NgZone) {
    this.mediaMatcher.addListener(mql => zone.run(() => this.mediaMatcher = mql));
  }

  ngOnInit() {
    if (this.config.native) {
      this.authSvc.getApplicationDetails(this.config.tokenApp)
        .subscribe((hatApp: HatApplication) => {
          if (hatApp.needsUpdating) {
            const queryParams: Params = {
              name: this.config.tokenApp,
              redirect: '/feed',
              internal: 'true'
            };

            this.router.navigate(['/hatlogin'], { queryParams });
          }
        });
    }
  }

  isSmallScreen(): boolean {
    return this.mediaMatcher.matches;
  }

  closeSideNav(event): void {
    if (this.isSmallScreen()) {
      this.sideNav.close();
    }
  }

}
