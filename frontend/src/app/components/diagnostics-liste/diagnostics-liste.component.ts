import { CommonModule } from '@angular/common';
import { Component,effect,inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Diagnostic } from '@app/models/diagnostic.model';
import { Site } from '@app/models/site.model';
import { SiteService } from '@app/services/sites.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { SitesDiagnosticsViewComponent } from "../parts/sites-diagnostics-view/sites-diagnostics-view.component";
import { toSignal } from '@angular/core/rxjs-interop';

//Affiche la liste des sites/diagnostics.
@Component({
    selector: 'app-diagostics-liste',
    templateUrl: './diagnostics-liste.component.html',
    styleUrls: ['./diagnostics-liste.component.css'],
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
export class DiagosticsListeComponent {
	sites = signal<Site[]>([])
	
	private siteService = inject(SiteService);
	title="";
  diagnostic:Diagnostic = new Diagnostic();
  sites$ = toSignal(
    this.siteService.getAll(), 
    { initialValue: [] }
  );
  constructor(){
    effect(() => {
      const sites = this.sites$();
      this.siteService.sortByName(sites);
			return this.sites.set(sites);

    });
  }

}

