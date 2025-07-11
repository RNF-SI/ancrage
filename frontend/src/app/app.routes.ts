import { LoginComponent } from "./home-rnf/components/login/login.component";
import { LogoutComponent } from "./home-rnf/components/logout/logout.component";
import { NavHomeComponent } from "./home-rnf/components/nav-home/nav-home.component";
import { LazyDialogLoader } from "./home-rnf/services/lazy-dialog-loader.service";
import { LogoutLinkService } from "./home-rnf/services/logout-link.service";
import { Routes } from '@angular/router';

export const routes: Routes = [{
  path: '',
  component: NavHomeComponent,
  children: [
    { path: 'logout', component: LogoutComponent, canActivate: [LogoutLinkService] },
    { path: 'login', component: LoginComponent, canActivate: [LazyDialogLoader] },
   /*  { path: 'methodologie', component: AncrageComponent, canActivate: [authGuard] }, */
  
  ]
}];