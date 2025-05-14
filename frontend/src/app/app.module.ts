import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

// Modules
import {MatIconModule} from '@angular/material/icon';
import {MatToolbarModule} from '@angular/material/toolbar';
import { MatMenuModule } from '@angular/material/menu';
import { HttpClientModule } from '@angular/common/http';
import { MatButtonModule} from '@angular/material/button';
import { HomeRnfModule } from './home-rnf/home-rnf.module';
import { RouterModule } from '@angular/router';
import { ToastrModule } from 'ngx-toastr';
import { fab } from '@fortawesome/free-brands-svg-icons';
import { far } from '@fortawesome/free-regular-svg-icons';
import { fas } from '@fortawesome/free-solid-svg-icons';

// Components
import { AncrageComponent } from './components/ancrage/ancrage.component';
import { IndexComponent } from './components/index/index.component';
import { LogoutComponent } from './components/logout/logout.component';
import { IntroConnectComponent } from './components/intro-connect/intro-connect.component';
import { ContactComponent } from './components/contact/contact.component';
import { MentionsComponent } from './components/mentions/mentions.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { DiagosticsListeComponent } from './components/diagnostics-liste/diagnostics-liste.component';
import { MapComponent } from './components/parts/map/map.component'; 
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { SitesDiagnosticsViewComponent } from './components/parts/sites-diagnostics-view/sites-diagnostics-view.component';
import { MesDiagnosticsComponent } from './components/mes-diagnostics/mes-diagnostics.component';
import { SiteComponent } from './components/site/site.component';
import { AlerteSiteComponent } from './components/alertes/alerte-site/alerte-site.component';
import { MatDialogModule } from '@angular/material/dialog';
import { ChoixActeursComponent } from './components/parts/choix-acteurs/choix-acteurs.component';
import { SiteLsComponent } from './components/site-ls/site-ls.component';
import { AlerteVisualisationSiteComponent } from './components/alertes/alerte-visualisation-site/alerte-visualisation-site.component';
import { DiagnosticComponent } from './components/diagnostic/diagnostic.component';
import { AlerteShowActorDetailsComponent } from './components/alertes/alerte-show-actor-details/alerte-show-actor-details.component';
import { ActeurComponent } from './components/acteur/acteur.component';
import { AlerteActeurComponent } from './components/alertes/alerte-acteur/alerte-acteur.component';
import { AlerteDiagnosticComponent } from './components/alertes/alerte-diagnostic/alerte-diagnostic.component';
import { EntretienComponent } from './components/entretien/entretien.component';
import { DiagnosticVisualisationComponent } from './components/diagnostic-visualisation/diagnostic-visualisation.component';
import { AlerteEntretienComponent } from './components/alertes/alerte-entretien/alerte-entretien.component';
import { GraphiquesComponent } from './components/parts/graphiques/graphiques.component';


@NgModule({
  declarations: [
    AppComponent,
    AncrageComponent,
    IndexComponent,
    LogoutComponent,
    IntroConnectComponent,
    ContactComponent,
    MentionsComponent,
    
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MatToolbarModule,
    MatIconModule,
    MatMenuModule,
    HttpClientModule,
    MatButtonModule,
    HomeRnfModule,
    RouterModule,
    NgbModule,
    MatDialogModule,
    DiagosticsListeComponent,
    SitesDiagnosticsViewComponent,
    MapComponent,
    MesDiagnosticsComponent,
    SiteComponent,
    AlerteSiteComponent,
    ChoixActeursComponent,
    SiteLsComponent,
    AlerteVisualisationSiteComponent,
    DiagnosticComponent,
    AlerteShowActorDetailsComponent,
    DiagnosticVisualisationComponent,
    ActeurComponent,
    AlerteActeurComponent, 
    AlerteDiagnosticComponent,
    EntretienComponent,
    AlerteEntretienComponent,
    GraphiquesComponent,
    ToastrModule.forRoot({
      timeOut: 15000
    }),
  
  ],
  providers: [
    
  ],
  bootstrap: [AppComponent]
})
export class AppModule { 
   constructor(library: FaIconLibrary) {
      library.addIconPacks(
        fab,
        fas,
        far
      );
    }
    
}
