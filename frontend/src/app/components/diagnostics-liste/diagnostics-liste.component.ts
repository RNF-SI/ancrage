import { CommonModule } from '@angular/common';
import { Component,inject,OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Diagnostic } from '@app/models/diagnostic.model';
import { Site } from '@app/models/site.model';
import { SiteService } from '@app/services/sites.service';
import { Subscription, switchMap, of } from 'rxjs';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

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
	MatTooltipModule
  ]
})
export class DiagosticsListeComponent implements OnInit{
  	diagnostics: Diagnostic[] = []; 
	sites:Site[]=[];
	titleBtnCreaDiag = "Nouveau diagnostic";
	infobulleCreaDiagFromSite="Ce bouton vous dirige directement vers le choix des acteurs. Le site indiqué sur cette ligne sera présélectionné.";
	infobulleCreaDiagFromScratch = "Utilisez ce bouton si le diagnostic comprend plusieurs sites ou si le site ciblé n'est pas dans la liste ci-dessous.";
	private siteService = inject(SiteService);
	
  	ngOnInit(): void {
		this.titleBtnCreaDiag="Nouveau diagnostic";
		this.siteService.getAll().subscribe(sites => {
			console.log(sites);
			this.sites = sites;
		});
	}

	ngOnDestroy(): void {
		
	}
  
  modifyDiagnostic(diagnostic: Diagnostic) {
    throw new Error('Method not implemented.');
  }

}

