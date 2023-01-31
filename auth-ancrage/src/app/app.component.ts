import { Component } from '@angular/core';
import {MatToolbarModule} from '@angular/material/toolbar';
import { Router } from '@angular/router';
import { AuthService } from '@services/auth.service';
import { Role } from './models/role-opnl.model';
// import { IdleService } from './services/idle.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'auth-ancrage';

  constructor(
    private router: Router,
    public _authService: AuthService,
    // public _idleService: IdleService,
    ) {
      // _idleService.setUp();

      // if (_authService.authenticated) {
      //   if(this._idleService.isSessionExpired()){
      //     this._idleService.showExpirationMessage();
      //   } else if (!_idleService.isServiceRunning()) {
      //     _idleService.startIdleSvc();
      //   }
      // }
    }

  // Signed In status
  public get signedIn(): boolean {
    return this._authService.authenticated || false;
  }

  // get Role OPNL
  // public get roleOPNL(): null|Role {
  //   return this._authService.getCurrentUserOPNLRole();
  // }

}
