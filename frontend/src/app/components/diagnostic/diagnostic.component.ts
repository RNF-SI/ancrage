import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, inject, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
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
import { MatDialog } from '@angular/material/dialog';
import { AlerteDiagnosticComponent } from '../alertes/alerte-diagnostic/alerte-diagnostic.component';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { DateAdapter } from '@angular/material/core';
import { MatMomentDateModule, MAT_MOMENT_DATE_ADAPTER_OPTIONS } from '@angular/material-moment-adapter';
import { MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { LOCALE_ID } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MatTooltipModule } from '@angular/material/tooltip';
import * as moment from 'moment';
import { Moment } from 'moment';


registerLocaleData(localeFr);

@Component({
  selector: 'app-diagnostic',
  templateUrl: './diagnostic.component.html',
  styleUrls: ['./diagnostic.component.css'],
  standalone:true,
  imports:[CommonModule,MatSelectModule, MatFormFieldModule,FormsModule,MatInputModule,ChoixActeursComponent,ReactiveFormsModule,MatButtonModule,MatDatepickerModule,MatMomentDateModule,FontAwesomeModule,MatTooltipModule],
  providers: [
    { provide: LOCALE_ID, useValue: 'fr-FR' },
    { provide: MAT_DATE_LOCALE, useValue: 'fr-FR' },
    { provide: MAT_MOMENT_DATE_ADAPTER_OPTIONS, useValue: { useUtc: true } },
    {
      provide: MAT_DATE_FORMATS,
      useValue: {
        parse: {
          dateInput: 'DD/MM/YY', 
        },
        display: {
          dateInput: 'DD/MM/YY',
          monthYearLabel: 'MMMM YYYY',
          dateA11yLabel: 'LL',
          monthYearA11yLabel: 'MMMM YYYY',
        },
      },
    },
  ]
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
  private dialog = inject(MatDialog);
  private diagnosticStoreSubscription ?:Subscription;
  private dateAdapter = inject(DateAdapter);

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
      date_rapport: this.fb.control<Moment | null>(null),
      created_by: [0, []],
      id_organisme: [0, []],
      modified_by: [0, []],
      identite_createur:[""],
      slug:['']
    });
  previousPage = "";
  user:any;
  infobulleSaisieDateRapport = "Attention ! Ne saisissez ce champ uniquement si vous avez publié votre rapport. Après la saisie de cette date, vous ne pourrez plus modifier le diagnostic.";
  slug="";
  
  ngOnInit(): void {
    console.log('init');
    let diagnostic = JSON.parse(localStorage.getItem("diagnostic")!);
    this.dateAdapter.setLocale('fr-FR');
    this.titleDiagnostic = this.titleCreateDiag;
    this.previousPage = localStorage.getItem("previousPage")!;
    this.user = this.authService.getCurrentUser();
    this.routeSubscription = this.route.params.subscribe(async (params: any) => {
      this.id_diagnostic = params['id_diagnostic'];  
      this.slug = params['slug'];
      const sites$ = this.siteService.getAll();
      const actors$ = this.actorsService.getAll();
  
      if (this.id_diagnostic && this.slug) {
        this.titleDiagnostic = this.titleModifyDiag;
        const diag$ = this.diagnosticsService.get(this.id_diagnostic,this.slug);
        this.formGroup.get('id_diagnostic')?.setValue(this.id_diagnostic);
  
        forkJoin([diag$,sites$, actors$]).subscribe(([diag,sites, acteurs]) => {
          
          if(diagnostic.sites.length > diag.sites.length || diagnostic.acteurs.length > diag.acteurs.length){
            this.diagnostic = diagnostic;
          }else{
            this.diagnostic = diag;
          }

          this.instructionswithResults(sites,acteurs);
         
          this.can_edit = diag.created_by == this.user_id;
          this.id_organisme = diag.id_organisme;
          this.user_id = diag.created_by;
          const remappedSites = (this.diagnostic.sites || []).map(site =>
            this.uniqueSites.find(s => s.id_site === site.id_site) || site
          );
          this.chosenSites = remappedSites;
          
          this.setActors(diag);
          
        });
      } else {
        
        this.diagnostic = diagnostic;
        console.log(this.diagnostic);
        this.chosenSites = this.diagnostic.sites;
        this.user_id = this.user?.id_role;
        this.id_organisme = this.user.id_organisme;
        forkJoin([sites$, actors$]).subscribe(([sites, acteurs]) => {
         
          this.instructionswithResults(sites,acteurs);
          this.setActors(this.diagnostic);
        });
      }
    });
    
  }

  setActors(diag:Diagnostic){
    const remappedActeurs = (this.diagnostic.acteurs || []).map(act =>
      this.uniqueActors.find(a => a.id_acteur === act.id_acteur) || act
    );
    
    this.formGroup.patchValue({
      id_diagnostic: diag.id_diagnostic,
      nom: diag.nom,
      sites: this.chosenSites,
      acteurs: remappedActeurs,
      slug: diag.slug
    });

    const selectedIds = new Set(remappedActeurs.map(a => a.id_acteur));
    
    this.uniqueActors.forEach(actor => {
      actor.selected = selectedIds.has(actor.id_acteur);
      
    });
    this.actors= this.uniqueActors;
    this.actorsService.sortByNameAndSelected(this.actors);
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
      this.diagnostic.nom = nom;
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

  navigate= (path:string,diagnostic:Diagnostic):void =>{
    
    localStorage.setItem("previousPage",this.router.url);
    this.siteService.navigateAndReload(path,diagnostic);
  }
  
  recordDiagnostic(event: Event){
    event.preventDefault();
    
    if (this.id_diagnostic == undefined){
      let nom = this.user.nom_role;
      let prenom = this.user.prenom_role;
      this.formGroup.get("identite_createur")?.setValue(nom + " "+ prenom);
      this.formGroup.get("created_by")?.setValue(this.user_id);
      this.formGroup.get("id_organisme")?.setValue(this.id_organisme);
     
      if (this.formGroup.valid) {
          this.convertDateReport();    
          this.diagnosticSubscription = this.diagnosticsService.add(this.diagnostic).subscribe(diagnostic=>{
            this.getConfirmation("Ce diagnostic vient d'être créé dans la base de données et contient ces informations : ",diagnostic);
          });
      }else{
        this.formGroup.markAllAsTouched();
      }
      
    }else{
      this.formGroup.get("modified_by")?.setValue(this.user_id);
      this.convertDateReport();
      if (this.formGroup.valid) {
        
        console.log(this.diagnostic);
        this.diagnosticSubscription = this.diagnosticsService.update(this.diagnostic).subscribe(diagnostic=>{
          this.getConfirmation("Ce diagnostic vient d'être créé dans la base de données et contient ces informations : ",diagnostic);
        });
      }else{
        this.formGroup.markAllAsTouched();
      }
    }
  }

  async getConfirmation(message:string,diag:Diagnostic){
      this.previousPage = localStorage.getItem("previousPage")!;
      this.diagnostic=diag;
      if(diag.id_diagnostic > 0){
       
        this.dialog.open(AlerteDiagnosticComponent, {
          data: {
            title: this.titleDiagnostic,
            message: message,
            labels: this.labels,
            diagnostic:this.diagnostic,
            previousPage:this.previousPage
          }
        });
      }
      
  }

  convertDateReport(){
    const rawValue = this.formGroup.getRawValue(); // ou .value si pas désactivé
    const payload = {
      ...rawValue,
      date_rapport: moment.isMoment(rawValue.date_rapport)
        ? rawValue.date_rapport.format('DD/MM/YYYY')
        : null
    };
    this.diagnostic = Object.assign(new Diagnostic(),payload);
  }

  ngOnDestroy(): void {
    this.routeSubscription?.unsubscribe();
    this.diagnosticSubscription?.unsubscribe();
    this.diagnosticStoreSubscription?.unsubscribe();
  }



}
