import { CommonModule } from '@angular/common';
import { Component, inject, NgModule, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Diagnostic } from '@app/models/diagnostic.model';
import { Site } from '@app/models/site.model';
import { SiteService } from '@app/services/sites.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { SitesDiagnosticsViewComponent } from '../sites-diagnostics-view/sites-diagnostics-view.component';
import { User } from '@app/models/user.model';
import { AuthGuardService } from '@app/home-rnf/services/auth-guard.service';
import { AuthService } from '@app/home-rnf/services/auth-service.service';

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

  export class MesDiagnosticsComponent implements OnInit{
    sites:Site[]=[];
    
    private siteService = inject(SiteService);
    private authService= inject(AuthService);
    private user_role_id:number=1;
    title="";
    
    ngOnInit(): void {
      this.title="Mes diagnostics";
      this.user_role_id = this.authService.getCurrentUser().id_role;
      this.getAllItemsByUser(this.user_role_id);
    }
  
    getAllItemsByUser(user_id:number):void{
      
      this.siteService.getAllByUser(user_id).subscribe(sites => {
        console.log(sites);
        return this.sites = sites;
      });
    }
  
    ngOnDestroy(): void {
      
    }
    
    modifyDiagnostic(diagnostic: Diagnostic) {
      throw new Error('Method not implemented.');
    }
  
  }