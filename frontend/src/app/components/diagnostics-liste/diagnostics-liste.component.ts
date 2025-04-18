import { CommonModule } from '@angular/common';
import { Component,inject,OnDestroy,OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Diagnostic } from '@app/models/diagnostic.model';
import { Site } from '@app/models/site.model';
import { SiteService } from '@app/services/sites.service';
import { Subscription, switchMap, of } from 'rxjs';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { SitesDiagnosticsViewComponent } from "../sites-diagnostics-view/sites-diagnostics-view.component";

@Component({
  selector: 'app-diagostics-liste',
  templateUrl: './diagnostics-liste.component.html',
  styleUrls: ['./diagnostics-liste.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    FontAwesomeModule,
    MatCardModule,
    MatTooltipModule,
    SitesDiagnosticsViewComponent
]
})
export class DiagosticsListeComponent implements OnInit, OnDestroy{
	sites:Site[]=[];
	
	private siteService = inject(SiteService);
	private sitesSub!: Subscription;
	title="";
	
  	ngOnInit(): void {
		this.title="Diagnostics";
		this.sitesSub = this.siteService.getAll().subscribe(sites => {
      this.siteService.sortByName(sites);
			return this.sites = sites;
		});;
	}

	ngOnDestroy(): void {
		this.sitesSub?.unsubscribe();
	}
  
  modifyDiagnostic(diagnostic: Diagnostic) {
    throw new Error('Method not implemented.');
  }

}

