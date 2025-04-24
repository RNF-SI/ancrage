import { CommonModule } from "@angular/common";
import { Component, inject, Input, OnInit } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatTooltipModule } from "@angular/material/tooltip";
import { Site } from "@app/models/site.model";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { RouterModule } from '@angular/router';
import { SiteService } from "@app/services/sites.service";
import { Diagnostic } from "@app/models/diagnostic.model";

@Component({
  selector: 'app-sites-diagnostics-view',
  templateUrl: './sites-diagnostics-view.component.html',
  styleUrls: ['./sites-diagnostics-view.component.css'],
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatTooltipModule, FontAwesomeModule,RouterModule],
})
export class SitesDiagnosticsViewComponent{
  
  @Input() sites: Site[] = [];
  @Input() titleBtnCreaDiag = "Nouveau diagnostic";
	@Input() infobulleCreaDiagFromSite="Ce bouton vous dirige directement vers le choix des acteurs. Le site indiqué sur cette ligne sera présélectionné.";
	@Input() infobulleCreaDiagFromScratch = "Utilisez ce bouton si le diagnostic comprend plusieurs sites ou si le site ciblé n'est pas dans la liste ci-dessous.";
  @Input() title="";
  @Input() diagnostic:Diagnostic = new Diagnostic();
  private siteService:SiteService = inject(SiteService);

  navigate(path:string,diagnostic:Diagnostic,site?:Site){
    this.siteService.navigateAndReload(path,diagnostic,site);
  }
}