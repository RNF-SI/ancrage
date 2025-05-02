import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Site } from '@app/models/site.model';
import { SiteService } from '@app/services/sites.service';
import { forkJoin, Subscription } from 'rxjs';
import { ChoixActeursComponent } from '../parts/choix-acteurs/choix-acteurs.component';
import { Acteur } from '@app/models/acteur.model';
import { Departement } from '@app/models/departement.model';
import { ActivatedRoute, Router } from '@angular/router';
import { ActeurService } from '@app/services/acteur.service';
import { Nomenclature } from '@app/models/nomenclature.model';
import { Diagnostic } from '@app/models/diagnostic.model';
import { DiagnosticService } from '@app/services/diagnostic.service';
import { MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-diagnostic',
  templateUrl: './diagnostic.component.html',
  styleUrls: ['./diagnostic.component.css'],
  standalone:true,
  imports:[CommonModule,MatSelectModule, MatFormFieldModule,FormsModule,MatInputModule,ChoixActeursComponent,ReactiveFormsModule,MatButtonModule]
})
export class DiagnosticComponent implements OnInit, OnDestroy{

  titleDiagnostic= "";
  titleCreateDiag="Créer un diagnostic";
  titleModifyDiag="Modifier un diagnostic";
  chooseSiteTitle = "Choisir les sites";
  btnCreateSiteLabel = "Créer un site";
  btnRecordDiag = "Enregistrer";
  labels: any;
  selectedRegion: any;
  sites:Site[]=[]
  uniqueRegions: any;
  selectedSite:Site = new Site();
  chosenSitesTitle = "Sites choisis";
  sitesSubscription?:Subscription;
  chosenSites:Site[] = [];
  actorsTitle ="Acteurs";
  actors:Acteur[]=[];
  uniqueSites:Site[]=[];
  uniqueActors:Acteur[]=[];
  uniqueDepartments:Departement[] = [];
  uniqueCategories:Nomenclature[] = [];
  actor:Acteur = new Acteur();
  site: any;
  uniqueDiagnostics:Diagnostic[]=[];
  selectedDiagnostic:Diagnostic = new Diagnostic();
  selectedCategory:Nomenclature = new Nomenclature()
  selectedDepartment:Departement = new Departement();
  diagnostic:Diagnostic = new Diagnostic();
  uniqueStatuts: any;
  titleSite: any;
  titleModif: any;
  nameLabel="Nom";
  private routeSubscription?:Subscription;
  private diagnosticSubscription ?:Subscription;
  private route = inject(ActivatedRoute);
  private actorsService = inject(ActeurService);
  private diagnosticsService = inject(DiagnosticService);
  private siteService = inject(SiteService);
  private router = inject(Router)
  actorsSelected:MatTableDataSource<Acteur>= new MatTableDataSource();
  actorsOriginal:Acteur[] = [];
  private fb = inject(FormBuilder);
  formGroup = this.fb.group({
      id_diagnostic: [0, [Validators.required]],
      nom: ['', [Validators.required]],
      sites: this.fb.control<Site[]>([], [Validators.required]),  
      acteurs: this.fb.control<Acteur[]>([], [Validators.required]),
      
    });
  
  ngOnInit(): void {
    this.titleDiagnostic = this.titleCreateDiag;
    this.actorsSelected = new MatTableDataSource(this.actors);
    if (localStorage.getItem("diagnostic")){

      this.diagnostic = JSON.parse(localStorage.getItem("diagnostic")!);
      this.chosenSites = this.diagnostic.sites;
      
    }
    localStorage.setItem("previousPage",this.router.url);
    this.routeSubscription = this.route.params.subscribe((params: any) => {
      const id_diagnostic = params['id_diagnostic'];  
  
      const sites$ = this.siteService.getAll();
      const actors$ = this.actorsService.getAll();
  
      if (id_diagnostic) {
        // 🔥 Charger les habitats, statuts ET site
       
  
        forkJoin([sites$, actors$]).subscribe(([sites, acteurs]) => {
          
          this.instructionswithResults(sites,acteurs);
          this.actor.commune.departement = (this.actor.commune?.departement || []).map(dpt =>
            this.uniqueDepartments.find(ud => ud.id_departement === dpt.id_departement) || dpt
          );
          this.actor.categories = (this.actor.categories|| []).map(cat =>
            this.uniqueCategories.find(uc => uc.id_nomenclature === cat.id_nomenclature) || cat
          );
        });
      } else {
        
        forkJoin([sites$, actors$]).subscribe(([sites, acteurs]) => {
          this.instructionswithResults(sites,acteurs);
          
        });
      }
    });
    
  }

  checkSite(){
    if (this.chosenSites?.length) {
      const chosenIds = this.chosenSites.map(site => site.id_site);
      this.chosenSites = this.uniqueSites.filter(site => chosenIds.includes(site.id_site));
      this.formGroup?.get('sites')?.setValue(this.chosenSites);
    }
  }

  instructionswithResults(sites:Site[],acteurs:Acteur[]){
    this.uniqueSites = sites;
    this.uniqueActors = acteurs;
    
    for (let i=0;i<acteurs.length;i++){
      let dpt:Departement = acteurs[i].commune.departement;
      let dptExiste = this.uniqueDepartments.some(d => d.id_dep === dpt.id_dep);
      
      if (!dptExiste){
        this.uniqueDepartments.push(dpt);
      }
      for (let j=0;j<acteurs[i].categories!.length;j++){
        let cat: Nomenclature = acteurs[i].categories![j];
        let catExiste = this.uniqueCategories.some(c => c.id_nomenclature === cat.id_nomenclature);
        
        if (!catExiste) {
          this.uniqueCategories.push(cat);
        }
      }
      
    }
    
    console.log(acteurs);
    this.checkSite();
    this.getDiagnostics(this.chosenSites);
  }

  getDiagnostics(sites:any){
    if (sites.length > 0){
      let array:number[]=[]
      for (let i = 0;i<sites.length;i++){
        array.push(sites[i].id_site);
      }
      let json = {
        site_ids:array
      }
      console.log(json);
      this.diagnosticSubscription = this.diagnosticsService.getAllBySites(json).subscribe(diagnostics =>{
        this.uniqueDiagnostics = diagnostics;
        console.log(diagnostics);
      });
    }
   
  }

  navigate(path:string,diagnostic:Diagnostic){
    diagnostic = Object.assign(new Diagnostic(),this.formGroup.value);

    this.siteService.navigateAndReload(path,diagnostic);
  }
  
  recordDiagnostic(event: Event){
    event.preventDefault();
    this.diagnostic = Object.assign(new Diagnostic(),this.formGroup.value);
    console.log(this.diagnostic);
    this.diagnosticSubscription = this.diagnosticsService.add(this.diagnostic).subscribe(diagnostic=>{
      console.log(diagnostic);
    })
  }

  ngOnDestroy(): void {
    this.routeSubscription?.unsubscribe();
    this.diagnosticSubscription?.unsubscribe();
  }

}
