/// <reference types="@angular/localize" />

import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes'
import { provideHttpClient } from '@angular/common/http';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faFacebook } from '@fortawesome/free-brands-svg-icons';
import { provideToastr } from 'ngx-toastr';
import { MomentDateAdapter, MAT_MOMENT_DATE_ADAPTER_OPTIONS, MAT_MOMENT_DATE_FORMATS } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_LOCALE, MAT_DATE_FORMATS } from '@angular/material/core';
import { RECAPTCHA_V3_SITE_KEY } from "ng-recaptcha-2";
import { provideMatomo, withRouter } from 'ngx-matomo-client';
import { Chart } from 'chart.js';
import { pluginLegendeRepliee, pluginTitreAdaptatif } from '@app/utils/options-graphiques';

library.add(faFacebook)

// Enregistrés une fois pour toutes : le premier redécoupe le titre de chaque
// graphique sur la largeur réelle de son canvas, le second dessine les légendes
// dont les entrées sont trop longues pour tenir sur une ligne. Tous deux restent
// sans effet sur les graphiques qui ne les déclarent pas.
Chart.register(pluginTitreAdaptatif, pluginLegendeRepliee)

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideAnimations(),
    provideHttpClient(), 
    provideToastr({
      positionClass: 'toast-below-nav',
      progressBar: true,
    }),
    {
      provide: DateAdapter,
      useClass: MomentDateAdapter,
      deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS]
    },
    { provide: MAT_DATE_FORMATS, useValue: MAT_MOMENT_DATE_FORMATS },
    { provide: MAT_DATE_LOCALE, useValue: 'fr-FR' },
    { provide: RECAPTCHA_V3_SITE_KEY, useValue: '6LdVGX0rAAAAAEtvEY2NkvUBuhRJ71lQ7ZkwbNX7' },
    provideMatomo(
      {
        siteId: 8,
        trackerUrl: 'https://matomo.reserves-naturelles.org',
      },
      withRouter(),
    ),
  ]
}).catch(err => console.error(err));
