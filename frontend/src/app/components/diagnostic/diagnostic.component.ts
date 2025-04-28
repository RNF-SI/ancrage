import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Site } from '@app/models/site.model';
import { SiteService } from '@app/services/sites.service';
import { forkJoin, Subscription } from 'rxjs';
import { ChoixActeursComponent } from '../parts/choix-acteurs/choix-acteurs.component';
import { Acteur } from '@app/models/acteur.model';
import { Departement } from '@app/models/departement.model';
import { ActivatedRoute } from '@angular/router';
import { ActeurService } from '@app/services/acteur.service';
import { Nomenclature } from '@app/models/nomenclature.model';

@Component({
  selector: 'app-diagnostic',
  templateUrl: './diagnostic.component.html',
  styleUrls: ['./diagnostic.component.css'],
  standalone:true,
  imports:[CommonModule,MatSelectModule, MatFormFieldModule,FormsModule,MatInputModule,ChoixActeursComponent]
})
export class DiagnosticComponent implements OnInit{
  
  titleDiagnostic= "";
  titleCreateDiag="Créer un diagnostic";
  titleModifyDiag="Modifier un diagnostic";
  chooseSiteTitle = "Choisir les sites";
  labels: any;
  selectedRegion: any;
  sites:Site[]=[]
  uniqueRegions: any;
  selectedSite:Site = new Site();
  chosenSitesTitle = "Sites choisis";
  sitesSubscription?:Subscription;
  private siteService = inject(SiteService);
  chosenSites:Site[] = [];
  actorsTitle ="Acteurs";
  actors:Acteur[]=[];
  uniqueSites:Site[]=[];
  uniqueActors:Acteur[]=[];
  uniqueDepartments:Departement[] = [];
  uniqueCategories:Nomenclature[] = [];
  actor:Acteur = new Acteur();
  site: any;

  uniqueStatuts: any;
  formGroup: any;
  titleSite: any;
  titleModif: any;
  private routeSubscription?:Subscription;
  private route = inject(ActivatedRoute);
  private actorsService = inject(ActeurService);
  
  ngOnInit(): void {
    
    this.routeSubscription = this.route.params.subscribe((params: any) => {
      const id_diagnostic = params['id_diagnostic'];  
  
      const sites$ = this.siteService.getAll();
      const actors$ = this.actorsService.getAll();
  
      if (id_diagnostic) {
        // 🔥 Charger les habitats, statuts ET site
       
  
        forkJoin([sites$, actors$]).subscribe(([sites, acteurs]) => {
          
          this.uniqueSites = sites;
          this.uniqueActors = acteurs;
          
          this.actor.commune.departement = (this.actor.commune?.departement || []).map(dpt =>
            this.uniqueDepartments.find(ud => ud.id_departement === dpt.id_departement) || dpt
          );
          this.actor.categories = (this.actor.categories|| []).map(cat =>
            this.uniqueCategories.find(uc => uc.id_nomenclature === cat.id_nomenclature) || cat
          );
         
        });
      } else {
        
        forkJoin([sites$, actors$]).subscribe(([sites, acteurs]) => {
          console.log('ok');
          this.uniqueSites = sites;
          this.uniqueActors = acteurs;
          console.log(sites);
          console.log(acteurs);
        });
      }
    });
    
  }

  applyFilters() {
    this.chosenSites = [];
    for (let i = 0; i < this.sites.length; i++) {
      if (this.sites[i].selected) {
        this.chosenSites.push(this.sites[i]);
      }
    }
  }

}
