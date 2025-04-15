import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Diagnostic } from '@app/models/diagnostic.model';
import { Site } from '@app/models/site.model';
import { SiteService } from '@app/services/sites.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { SitesDiagnosticsViewComponent } from '../sites-diagnostics-view/sites-diagnostics-view.component';

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
      SitesDiagnosticsViewComponent
  ]
})
  export class MesDiagnosticsComponent implements OnInit{
    sites:Site[]=[];
    
    private siteService = inject(SiteService);
    title="";
    
    ngOnInit(): void {
      this.title="Mes diagnostics";
      this.getAllItems();
    }
  
    getAllItems():void{
      this.siteService.getAll().subscribe(sites => {
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