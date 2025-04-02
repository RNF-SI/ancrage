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
    }]}
  
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
