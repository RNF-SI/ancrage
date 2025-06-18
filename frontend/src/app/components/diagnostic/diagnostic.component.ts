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
import { Nomenclature } from '@app/models/nomenclature.model';
import { Diagnostic } from '@app/models/diagnostic.model';
import { DiagnosticService } from '@app/services/diagnostic.service';
import { MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '@app/home-rnf/services/auth-service.service';
import { Labels } from '@app/utils/labels';
import { MatDialog } from '@angular/material/dialog';
import { AlerteDiagnosticComponent } from '../alertes/alerte-diagnostic/alerte-diagnostic.component';
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import moment from 'moment';
import { Moment } from 'moment';

registerLocaleData(localeFr);

//Pour création ou modification d'un diagnostic
@Component({
  selector: 'app-diagnostic',
  templateUrl: './diagnostic.component.html',
  styleUrls: ['./diagnostic.component.css'],
  standalone:true,
  imports:[CommonModule,MatSelectModule, MatFormFieldModule,FormsModule,MatInputModule,ChoixActeursComponent,ReactiveFormsModule,MatButtonModule],
  
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
  private diagnosticsService = inject(DiagnosticService);
  private siteService = inject(SiteService);
  private authService = inject(AuthService);
  private dialog = inject(MatDialog);
  private diagnosticStoreSubscription ?:Subscription;
  
  no_creation=true;
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
      date_rapport: this.fb.control<Moment | null>(null),
      created_by: [0, []],
      id_organisme: [0, []],
      modified_by: [0, []],
      identite_createur:[""],
      slug:['']
    });
  previousPage = "";
  user:any;
  slug="";
  private actorsSub?:Subscription;
  initialize=true;
  
  ngOnInit(): void {
    
    let diagnostic = JSON.parse(localStorage.getItem("diagnostic")!);
    this.titleDiagnostic = this.titleCreateDiag;
    this.previousPage = localStorage.getItem("previousPage")!;
    this.user = this.authService.getCurrentUser();
    this.routeSubscription = this.route.params.subscribe((params: any) => {
      this.id_diagnostic = params['id_diagnostic'];  
      this.slug = params['slug'];
      const sites$ = this.siteService.getAll();
      //Modification
      if (this.id_diagnostic && this.slug) {
        this.titleDiagnostic = this.titleModifyDiag;
        const diag$ = this.diagnosticsService.get(this.id_diagnostic,this.slug);
        this.formGroup.get('id_diagnostic')?.setValue(this.id_diagnostic);
  
        forkJoin([diag$,sites$]).subscribe(([diag,sites]) => {
          this.uniqueSites = sites;
          if(diagnostic.sites.length > diag.sites.length || diagnostic.acteurs.length > diag.acteurs.length){
            this.diagnostic = diagnostic;
          }else{
            this.diagnostic = diag;
          }
          this.can_edit = diag.created_by == this.user_id;
          this.id_organisme = diag.id_organisme;
          this.user_id = diag.created_by;
          if (!this.initialize){

          }
          const remappedSites = (this.diagnostic.sites || []).map(site =>
            this.uniqueSites.find(s => s.id_site === site.id_site) || site
          );
          this.chosenSites = remappedSites;
          this.initialize = false;
          this.checkSite();
          this.getDiagName(this.chosenSites,diagnostic);
        });
      } else {
        //Création
        this.diagnostic = diagnostic;
        this.user_id = this.user?.id_role;
        this.id_organisme = this.user.id_organisme;

        forkJoin([sites$]).subscribe(([sites]) => {
          this.uniqueSites = sites;

          const remappedSites = (this.diagnostic.sites || []).map(site =>
            this.uniqueSites.find(s => s.id_site === site.id_site) || site
          );
          this.chosenSites = remappedSites;
          this.initialize = false;
          this.checkSite();
          this.getDiagName(this.chosenSites,diagnostic);
        });
      }
      
    });
    
  }

  //Met à jour la liste this.chosenSites
  checkSite(){

    if (this.chosenSites?.length) {
      
      const chosenIds = this.chosenSites.map(site => site.id_site);
      this.chosenSites = this.uniqueSites.filter(site => chosenIds.includes(site.id_site));
      this.formGroup?.get('sites')?.setValue(this.chosenSites);
      
    }
  }

  //Navigation et mise en cache
  navigate= (path:string,diagnostic:Diagnostic):void =>{
    
    this.siteService.navigateAndCache(path,diagnostic);
  }
  
  //Enregistre le diagnostic
  recordDiagnostic(event: Event){
    event.preventDefault();
    
    if (this.id_diagnostic == undefined){
      let nom = this.user.nom_role;
      let prenom = this.user.prenom_role;
      this.formGroup.get("identite_createur")?.setValue(nom + " "+ prenom);
      this.formGroup.get("created_by")?.setValue(this.user_id);
      this.formGroup.get("id_organisme")?.setValue(this.id_organisme);

      //Ajout
      if (this.formGroup.valid) {
          this.convertDateReport();    
          this.diagnosticSubscription = this.diagnosticsService.add(this.diagnostic).subscribe(diagnostic=>{
            this.getConfirmation("Ce diagnostic vient d'être créé dans la base de données et contient ces informations : ",diagnostic,true);
          });
      }else{
        this.formGroup.markAllAsTouched();
      }
      
    }else{
      //Modification
      this.formGroup.get("modified_by")?.setValue(this.user_id);
      this.convertDateReport();
      if (this.formGroup.valid) {
        this.diagnosticSubscription = this.diagnosticsService.update(this.diagnostic).subscribe(diagnostic=>{
          this.getConfirmation("Ce diagnostic vient d'être créé dans la base de données et contient ces informations : ",diagnostic,true);
        });
      }else{
        this.formGroup.markAllAsTouched();
      }
    }
  }

  //Message de confirmation
  getConfirmation(message:string,diag:Diagnostic,no_creation?:boolean){
      this.previousPage = localStorage.getItem("previousPage")!;
      this.diagnostic=diag;
      if(diag.id_diagnostic > 0){
        this.dialog.open(AlerteDiagnosticComponent, {
          data: {
            title: this.titleDiagnostic,
            message: message,
            labels: this.labels,
            diagnostic:this.diagnostic,
            previousPage:this.previousPage,
            no_creation:no_creation
          }
        });
      }
      
  }

  //Convertie la date pour le back et parse le diagnostic
  convertDateReport(){
    const rawValue = this.formGroup.getRawValue(); // ou .value si pas désactivé
    const payload = {
      ...rawValue,
      nom: rawValue.nom,
      date_rapport: moment.isMoment(rawValue.date_rapport)
      ? rawValue.date_rapport.toDate()
      : undefined,
      sites: (rawValue.sites || []).map((s: any) => Site.fromJson(s))
    };
    this.diagnostic = Object.assign(new Diagnostic(),payload);
   
  }

  ngOnDestroy(): void {
    this.routeSubscription?.unsubscribe();
    this.diagnosticSubscription?.unsubscribe();
    this.diagnosticStoreSubscription?.unsubscribe();
    this.actorsSub?.unsubscribe();
  }

  compareSites = (s1: Site, s2: Site) => s1 && s2 && s1.id_site === s2.id_site;

   //Récupère les acteurs des sites sélectionnés et crée le nom en fonction des sites
  getDiagName(sites:any,diag:Diagnostic){
    
    if(sites.length > 0){
      this.chosenSites= sites;
      let array:number[]=[];
      for(let i=0;i<sites.length;i++){
        array.push(sites[i].id_site);
      }
      let json={
        id_sites:array
      }
      let nom ="";
        
      for (let i =0;i<sites.length;i++){
        nom += sites[i].nom + " ";
        
      }
      nom = "Diagnostic - "+ nom + "- " + new Date().getFullYear();
      this.diagnostic.nom = nom;
      this.formGroup.get('nom')?.setValue(nom);
    }
  }

}
