import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { IndexComponent } from './components/index/index.component';
import { AncrageComponent } from './components/ancrage/ancrage.component';

import { LogoutComponent } from './components/logout/logout.component';

import { IntroConnectComponent } from './components/intro-connect/intro-connect.component';
import { MentionsComponent } from './components/mentions/mentions.component';
import { ContactComponent } from './components/contact/contact.component';
import { NavHomeComponent } from './home-rnf/components/nav-home/nav-home.component';
import { LoginComponent } from './home-rnf/components/login/login.component';
import { AuthGuardService } from './home-rnf/services/auth-guard.service';
import { LogoutLinkService } from './home-rnf/services/logout-link.service';
import { LazyDialogLoader } from './home-rnf/services/lazy-dialog-loader.service';
import { DiagosticsListeComponent } from './components/diagnostics-liste/diagnostics-liste.component';
import { MesDiagnosticsComponent } from './components/mes-diagnostics/mes-diagnostics.component';
import { SiteComponent } from './components/site/site.component';
import { ChoixActeursComponent } from './components/parts/choix-acteurs/choix-acteurs.component';
import { SiteLsComponent } from './components/site-ls/site-ls.component';
import { DiagnosticComponent } from './components/diagnostic/diagnostic.component';
import { DiagnosticVisualisationComponent } from './diagnostic-visualisation/diagnostic-visualisation.component';

const routes: Routes = [ { 
  path: '', 
  component: NavHomeComponent,
   children: [ { path: 'logout',
    component: LogoutComponent, 
    canActivate: [ LogoutLinkService ] }, 
    { path: 'login', 
      component: LoginComponent, 
      canActivate: [ LazyDialogLoader ] 
    },
    {
      path: 'methodologie',
      component: AncrageComponent,
      canActivate: [AuthGuardService]
    },
    {
      path: 'intro-connect',
      component: IntroConnectComponent,
      canActivate: [AuthGuardService]
    },
    {
      path: 'contact',
      component: ContactComponent,
    },
    {
      path: 'mentions',
      component: MentionsComponent,
    },
    {
      path: '',
      component: IndexComponent,
    },
    {
      path: 'diagnostics-liste',
      component: DiagosticsListeComponent,
      canActivate: [AuthGuardService]
    },
    {
      path: 'mes-diagnostics',
      component: MesDiagnosticsComponent,
      canActivate: [AuthGuardService]
    },
    {
      path: 'site',
      component: SiteComponent,
      canActivate: [AuthGuardService]
    },
    {
      path: 'site/:id_site',
      component: SiteComponent,
      canActivate: [AuthGuardService]
    },
    {
      path: 'site-ls/:id_site',
      component: SiteLsComponent,
      canActivate: [AuthGuardService]
    },
    {
      path: 'choix-acteurs',
      component: ChoixActeursComponent,
      canActivate: [AuthGuardService]
    },
    {
      path: 'diagnostic',
      component: DiagnosticComponent,
      canActivate: [AuthGuardService]
    },
    {
      path: 'diagnostic/:id_diagnostic',
      component: DiagnosticComponent,
      canActivate: [AuthGuardService]
    },
    {
      path: 'diagnostic-visualisation/:id_diagnostic',
      component: DiagnosticVisualisationComponent,
      canActivate: [AuthGuardService]
    }
  ]},
   
];

@NgModule({
  imports: [RouterModule.forRoot(routes,{ onSameUrlNavigation: 'reload' })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
