import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LazyDialogLoader } from './loginModule/lazy-dialog/lazy-dialog.service';
import { IndexComponent } from './components/index/index.component';
import { AncrageComponent } from './components/ancrage/ancrage.component';
import { LogoutLinkService } from './services/logout-link.service';
import { LogoutComponent } from './components/logout/logout.component';
import { AuthGuardService } from './services/auth-guard.service';
import { IntroConnectComponent } from './components/intro-connect/intro-connect.component';
import { MentionsComponent } from './components/mentions/mentions.component';
import { ContactComponent } from './components/contact/contact.component';


const routes: Routes = [
  {
    path: 'login',
    canActivate: [ LazyDialogLoader ],
    loadChildren: () => import('./loginModule/login.module').then(m => m.LoginModule)
  },
  {
    path: 'logout',
    // Ici seulement pour angular, mais toujour redirigé dans le canActivate
    component: LogoutComponent,
    canActivate: [ LogoutLinkService ]
  },
  {
    path: 'ancrage',
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
    

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
