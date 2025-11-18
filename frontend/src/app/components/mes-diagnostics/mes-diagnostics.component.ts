import { CommonModule } from '@angular/common';
import { Component, effect, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Diagnostic } from '@app/models/diagnostic.model';
import { Site } from '@app/models/site.model';
import { SiteService } from '@app/services/sites.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { SitesDiagnosticsViewComponent } from '../parts/sites-diagnostics-view/sites-diagnostics-view.component';
import { AuthService } from '@app/home-rnf/services/auth-service.service';
import { toSignal } from '@angular/core/rxjs-interop';

//Affiche les diagnostics de l'utilisateur
@Component({
    selector: 'app-mes-diagnostics',
    templateUrl: './mes-diagnostics.component.html',
    styleUrls: ['./mes-diagnostics.component.css'],
    imports: [
        CommonModule,
        MatButtonModule,
        FontAwesomeModule,
        MatCardModule,
        MatTooltipModule,
        SitesDiagnosticsViewComponent,
    ]
})

  export class MesDiagnosticsComponent{
   
    private authService= inject(AuthService);
   
    title="Mes diagnostics";
    diagnostic:Diagnostic = new Diagnostic();

    sites = signal<Site[]>([])
	
    private siteService = inject(SiteService);
    user_role_id = this.authService.getCurrentUser().id_role;
    sites$ = toSignal(
      
      this.siteService.getAllByUser(this.user_role_id), 
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