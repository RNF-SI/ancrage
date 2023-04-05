import { Injectable } from '@angular/core';
import { Router, CanActivate } from '@angular/router';
import { AuthService } from './auth.service';


@Injectable({
  providedIn: 'root'
})
export class LogoutLinkService implements CanActivate{
  constructor(private auth: AuthService, private router: Router) { }

  canActivate() {

    // Do nothing if already out
    if(!this.auth.authenticated) { return false; }

    // Signs-out and redirects to home
    this.auth.logout();

    return this.router.createUrlTree(['/']);
  }
}
