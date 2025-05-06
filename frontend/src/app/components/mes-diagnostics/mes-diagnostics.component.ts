import { CommonModule } from '@angular/common';
import { Component, inject, NgModule, OnDestroy, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Diagnostic } from '@app/models/diagnostic.model';
import { Site } from '@app/models/site.model';
import { SiteService } from '@app/services/sites.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { SitesDiagnosticsViewComponent } from '../parts/sites-diagnostics-view/sites-diagnostics-view.component';
import { AuthService } from '@app/home-rnf/services/auth-service.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-mes-diagnostics',
  templateUrl: './mes-diagnostics.component.html',
  styleUrls: ['./mes-diagnostics.component.css'],
  standalone:true,
  imports: [
      CommonModule,
      MatButtonModule,
      FontAwesomeModule,
      MatCardModule,
      MatTooltipModule,
      SitesDiagnosticsViewComponent,
    
  ]
  
})

  export class MesDiagnosticsComponent implements OnInit,OnDestroy{
    sites:Site[]=[];
    
    private siteService = inject(SiteService);
    private authService= inject(AuthService);
    private user_role_id:number=1;
    private sitesSub!:Subscription;
    title="Mes diagnostics";
    diagnostic:Diagnostic = new Diagnostic();

    ngOnInit(): void {
      this.title="Mes diagnostics";
      localStorage.removeItem("diagnostic");
      this.user_role_id = this.authService.getCurrentUser().id_role;
      this.sitesSub =  this.siteService.getAllByUser(this.user_role_id).subscribe(sites => {
        this.sites = sites;
      });
    }
  
    ngOnDestroy(): void {
      this.sitesSub?.unsubscribe();
    }
  
  }