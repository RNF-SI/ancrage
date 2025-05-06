import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Site } from '@app/models/site.model';
import { SiteService } from '@app/services/sites.service';
import { forkJoin, Subscription, throwError } from 'rxjs';
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
import { DepartementService } from '@app/services/departement.service';
import { NomenclatureService } from '@app/services/nomenclature.service';
import { AuthService } from '@app/home-rnf/services/auth-service.service';
import { Labels } from '@app/utils/labels';

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
  btnCreateSiteLabel = "Créer un site";
  btnRecordDiag = "Enregistrer";
  labels = new Labels();
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
  id_diagnostic=0;
  private routeSubscription?:Subscription;
  private diagnosticSubscription ?:Subscription;
  private route = inject(ActivatedRoute);
  private actorsService = inject(ActeurService);
  private diagnosticsService = inject(DiagnosticService);
  private siteService = inject(SiteService);
  private router = inject(Router)
  private departementService = inject(DepartementService);
  private nomenclatureService = inject(NomenclatureService);
  private authService = inject(AuthService);
  user_id=0;
  id_organisme = 0;
  actorsSelected:MatTableDataSource<Acteur>= new MatTableDataSource();
  actorsOriginal:Acteur[] = [];
  can_edit = false;
  private fb = inject(FormBuilder);
  formGroup = this.fb.group({
      id_diagnostic: [0, [Validators.required]],
      nom: ['', [Validators.required]],
      sites: this.fb.control<Site[]>([], [Validators.required]),  
      acteurs: this.fb.control<Acteur[]>([], [Validators.required]),
      diagnostic_selectionne: this.fb.control<Diagnostic | null>(null),
      created_by: [0, [Validators.required]],
      id_organisme: [0, [Validators.required]],
      modified_by: [0, [Validators.required]],
    });
  previousPage = "";
  
  ngOnInit(): void {
    this.titleDiagnostic = this.titleCreateDiag;
    this.previousPage = localStorage.getItem("previousPage")!;
    if (localStorage.getItem("diagnostic")){

      this.diagnostic = JSON.parse(localStorage.getItem("diagnostic")!);
      this.chosenSites = this.diagnostic.sites;
      
    }
   
    
    this.routeSubscription = this.route.params.subscribe((params: any) => {
      this.id_diagnostic = params['id_diagnostic'];  
  
      const sites$ = this.siteService.getAll();
      const actors$ = this.actorsService.getAll();
  
      if (this.id_diagnostic) {
        this.titleDiagnostic = this.titleModifyDiag;
        const diag$ = this.diagnosticsService.get(this.id_diagnostic);
        this.formGroup.get('id_diagnostic')?.setValue(this.id_diagnostic);
  
        forkJoin([diag$,sites$, actors$]).subscribe(([diag,sites, acteurs]) => {
          
          this.instructionswithResults(sites,acteurs);
         
          this.can_edit = diag.created_by == this.user_id;
          this.id_organisme = diag.id_organisme;
          this.user_id = diag.created_by;
          const remappedSites = (diag.sites || []).map(site =>
            this.uniqueSites.find(s => s.id_site === site.id_site) || site
          );
          
          const remappedActeurs = (diag.acteurs || []).map(act =>
            this.uniqueActors.find(a => a.id_acteur === act.id_acteur) || act
          );

          this.chosenSites = remappedSites;
          this.formGroup.patchValue({
            id_diagnostic: diag.id_diagnostic,
            nom: diag.nom,
            sites: remappedSites,
            acteurs: remappedActeurs,
          });

          for (let i = 0;i<this.uniqueActors.length;i++){
            for (let j = 0;j<remappedActeurs.length;j++){
              if (this.uniqueActors[i]==remappedActeurs[j]){
                this.uniqueActors[i].selected = true;
              }
            }
          }
          
          this.actors= this.uniqueActors;
          this.actorsService.sortByNameAndSelected(this.actors);
          
        });
      } else {
        this.user_id = this.authService.getCurrentUser().id_role;
        this.id_organisme = this.authService.getCurrentUser().id_organisme;
        forkJoin([sites$, actors$]).subscribe(([sites, acteurs]) => {
          this.instructionswithResults(sites,acteurs);
          this.actors = this.uniqueActors;
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
    this.actorsService.sortByNameAndSelected(this.uniqueActors);
    this.siteService.sortByName(this.uniqueSites);
    this.departementService.sortByName(this.uniqueDepartments);
    this.nomenclatureService.sortByName(this.uniqueCategories);
    
    this.checkSite();
   
    this.getDiagnostics(this.chosenSites);
  }

  getDiagnostics(sites:any){
    if (sites.length > 0){
      let nom ="";
      
      for (let i =0;i<sites.length;i++){
        nom += sites[i].nom + " ";
        
      }
      nom = "Diagnostic - "+ nom + "- " + new Date().getFullYear();
      this.formGroup.get('nom')?.setValue(nom);
      let array:number[]=[];
      for (let i = 0;i<sites.length;i++){
        array.push(sites[i].id_site);
      }
      let json = {
        site_ids:array
      }
      
      this.diagnosticSubscription = this.diagnosticsService.getAllBySites(json).subscribe(diagnostics =>{
        this.uniqueDiagnostics = diagnostics;
       
      });
    }
   
  }

  navigate(path:string,diagnostic:Diagnostic){
    diagnostic = Object.assign(new Diagnostic(),this.formGroup.value);
    localStorage.setItem("previousPage",this.router.url);
    this.siteService.navigateAndReload(path,diagnostic);
  }
  
  recordDiagnostic(event: Event){
    event.preventDefault();
    
    if (this.id_diagnostic == undefined){
      this.formGroup.get("created_by")?.setValue(this.user_id);
      this.formGroup.get("id_organisme")?.setValue(this.id_organisme);
      this.diagnostic = Object.assign(new Diagnostic(),this.formGroup.value);
      this.diagnosticSubscription = this.diagnosticsService.add(this.diagnostic).subscribe(diagnostic=>{
        this.siteService.navigateAndReload('/diagnostic/'+diagnostic.id_diagnostic,diagnostic);
      })
    }else{
      this.formGroup.get("modified_by")?.setValue(this.user_id);
      this.diagnostic = Object.assign(new Diagnostic(),this.formGroup.value);
      this.diagnosticSubscription = this.diagnosticsService.update(this.diagnostic).subscribe(diagnostic=>{
        this.siteService.navigateAndReload('/diagnostic/'+diagnostic.id_diagnostic,diagnostic);
      })
    }
  }

  ngOnDestroy(): void {
    this.routeSubscription?.unsubscribe();
    this.diagnosticSubscription?.unsubscribe();
  }

}
