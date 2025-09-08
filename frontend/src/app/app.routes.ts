import { Routes } from '@angular/router';
import { IndexComponent } from './components/index/index.component';
import { AncrageComponent } from './components/ancrage/ancrage.component';
import { LogoutComponent } from './components/logout/logout.component';
import { IntroConnectComponent } from './components/intro-connect/intro-connect.component';
import { MentionsComponent } from './components/mentions/mentions.component';
import { ContactComponent } from './components/contact/contact.component';
import { NavHomeComponent } from './home-rnf/components/nav-home/nav-home.component';
import { LoginComponent } from './home-rnf/components/login/login.component';
import { authGuard } from './home-rnf/services/auth-guard.service';
import { LogoutLinkService } from './home-rnf/services/logout-link.service';
import { LazyDialogLoader } from './home-rnf/services/lazy-dialog-loader.service';
import { DiagosticsListeComponent } from './components/diagnostics-liste/diagnostics-liste.component';
import { MesDiagnosticsComponent } from './components/mes-diagnostics/mes-diagnostics.component';
import { SiteComponent } from './components/site/site.component';
import { ChoixActeursComponent } from './components/parts/choix-acteurs/choix-acteurs.component';
import { SiteLsComponent } from './components/site-ls/site-ls.component';
import { DiagnosticComponent } from './components/diagnostic/diagnostic.component';
import { ActeurComponent } from './components/acteur/acteur.component';
import { EntretienComponent } from './components/entretien/entretien.component';
import { DiagnosticVisualisationComponent } from './components/diagnostic-visualisation/diagnostic-visualisation.component';

export const routes: Routes = [{
  path: '',
  component: NavHomeComponent,
  children: [
    { path: 'logout', component: LogoutComponent, canActivate: [LogoutLinkService] },
    { path: 'login', component: LoginComponent, canActivate: [LazyDialogLoader] },
    { path: 'methodologie', component: AncrageComponent, canActivate: [authGuard] },
    { path: 'intro-connect', component: IntroConnectComponent, canActivate: [authGuard] },
    { path: 'contact', component: ContactComponent },
    { path: 'mentions', component: MentionsComponent },
    { path: '', component: IndexComponent },
    { path: 'diagnostics-liste', component: DiagosticsListeComponent, canActivate: [authGuard] },
    { path: 'mes-diagnostics', component: MesDiagnosticsComponent, canActivate: [authGuard] },
    { path: 'site/create', component: SiteComponent, canActivate: [authGuard] },
    { path: 'site/:id_site/:slug/update', component: SiteComponent, canActivate: [authGuard] },
    { path: 'site-ls/:id_site/:slug', component: SiteLsComponent, canActivate: [authGuard] },
    { path: 'choix-acteurs/:id_diagnostic/:slug', component: ChoixActeursComponent, canActivate: [authGuard] },
    { path: 'diagnostic/create', component: DiagnosticComponent, canActivate: [authGuard] },
    { path: 'diagnostic/:id_diagnostic/:slug/update', component: DiagnosticComponent, canActivate: [authGuard] },
    { path: 'diagnostic-visualisation/:id_diagnostic/:slug', component: DiagnosticVisualisationComponent, canActivate: [authGuard] },
    { path: 'acteur/create', component: ActeurComponent, canActivate: [authGuard] },
    { path: 'acteur/:id_acteur/:slug/update', component: ActeurComponent, canActivate: [authGuard] },
    { path: 'entretien/:id_acteur/:slug/update', component: EntretienComponent, canActivate: [authGuard] }
  ]
}];