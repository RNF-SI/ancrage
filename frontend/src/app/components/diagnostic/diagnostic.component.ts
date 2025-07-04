import { CommonModule } from '@angular/common';
import { Component, effect, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Site } from '@app/models/site.model';
import { SiteService } from '@app/services/sites.service';
import { forkJoin, Subscription } from 'rxjs';
import { Departement } from '@app/models/departement.model';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { Nomenclature } from '@app/models/nomenclature.model';
import { Diagnostic } from '@app/models/diagnostic.model';
import { DiagnosticService } from '@app/services/diagnostic.service';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '@app/home-rnf/services/auth-service.service';
import { Labels } from '@app/utils/labels';
import { MatDialog } from '@angular/material/dialog';
import { AlerteDiagnosticComponent } from '../alertes/alerte-diagnostic/alerte-diagnostic.component';
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import moment from 'moment';
import { Moment } from 'moment';
import { toSignal } from '@angular/core/rxjs-interop';
import { LoadingSpinnerComponent } from '@app/home-rnf/components/loading-spinner/loading-spinner.component';
import { ToastrService } from 'ngx-toastr';

registerLocaleData(localeFr);

//Pour création ou modification d'un diagnostic
@Component({
    selector: 'app-diagnostic',
    templateUrl: './diagnostic.component.html',
    styleUrls: ['./diagnostic.component.css'],
    imports: [CommonModule, MatSelectModule, MatFormFieldModule, FormsModule, MatInputModule, ReactiveFormsModule, MatButtonModule,LoadingSpinnerComponent],
    standalone:true
})
export class DiagnosticComponent implements OnDestroy{

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
  uniqueSites:Site[]=[];
  uniqueDepartments:Departement[] = [];
  uniqueCategories:Nomenclature[] = [];
  site: any;
  uniqueDiagnostics:Diagnostic[]=[];
  selectedDiagnostic:Diagnostic = new Diagnostic();
  selectedCategory:Nomenclature = new Nomenclature()
  selectedDepartment:Departement = new Departement();
  diagnostic = signal<Diagnostic>(new Diagnostic());
  uniqueStatuts: any;
  titleSite: any;
  titleModif: any;
  nameLabel="Nom";
  id_diagnostic=signal<number>(0);
  private diagnosticSubscription ?:Subscription;
  private diagnosticsService = inject(DiagnosticService);
  private siteService = inject(SiteService);
  private authService = inject(AuthService);
  private dialog = inject(MatDialog);
  private router = inject(Router);
  no_creation=true;
  user_id=0;
  id_organisme = 0;
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
  slug=signal<string>("");
  private actorsSub?:Subscription;
  initialize=true;
  routeParams = toSignal(inject(ActivatedRoute).params, { initialValue: {} });
  isLoading=true;
  private toaster = inject(ToastrService);

  constructor() {
    effect(() => {
      let diagnostic = JSON.parse(localStorage.getItem("diagnostic")!);
      this.titleDiagnostic = this.titleCreateDiag;
      this.previousPage = localStorage.getItem("previousPage")!;
      this.user = this.authService.getCurrentUser();
      localStorage.setItem("pageDiagCreation",this.router.url);
      const { id_diagnostic, slug } = this.routeParams() as Params;
      const id = Number(id_diagnostic);
      const slugValue = slug as string;
      const sites$ = this.siteService.getAll();
  
      if (id && slugValue) {
        this.id_diagnostic.set(id);
        this.slug.set(slugValue);
  
        this.titleDiagnostic = this.titleModifyDiag;
        const diag$ = this.diagnosticsService.get(this.id_diagnostic(),this.slug());
        this.formGroup.get('id_diagnostic')?.setValue(this.id_diagnostic());
  
        forkJoin([diag$,sites$]).subscribe(([diag,sites]) => {
          this.uniqueSites = sites;
          if(diagnostic.sites.length > diag.sites.length || diagnostic.acteurs.length > diag.acteurs.length){
            this.diagnostic.set(diagnostic);
          }else{
            this.diagnostic.set(diag);
          }
          this.can_edit = diag.created_by == this.user_id;
          this.id_organisme = diag.id_organisme;
          this.user_id = diag.created_by;
          if (!this.initialize){

          }
          const remappedSites = (this.diagnostic().sites || []).map(site =>
            this.uniqueSites.find(s => s.id_site === site.id_site) || site
          );
          this.chosenSites = remappedSites;
          this.initialize = false;
          this.checkSite();
          this.getDiagName(this.chosenSites);
        });
      }else{
        this.diagnostic.set(diagnostic);
        this.user_id = this.user?.id_role;
        this.id_organisme = this.user.id_organisme;

        forkJoin([sites$]).subscribe(([sites]) => {
          this.uniqueSites = sites;

          const remappedSites = (this.diagnostic().sites || []).map(site =>
            this.uniqueSites.find(s => s.id_site === site.id_site) || site
          );
          this.chosenSites = remappedSites;
          this.initialize = false;
          this.checkSite();
          this.getDiagName(this.chosenSites);
        });
      }
    });
  }

  //Met à jour la liste this.chosenSites
  checkSite(){
    this.isLoading = false;
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
    
    if (this.id_diagnostic() == 0){
      let nom = this.user.nom_role;
      let prenom = this.user.prenom_role;
      this.formGroup.get("identite_createur")?.setValue(nom + " "+ prenom);
      this.formGroup.get("created_by")?.setValue(this.user_id);
      this.formGroup.get("id_organisme")?.setValue(this.id_organisme);

      //Ajout
      if (this.formGroup.valid) {
          this.convertDateReport();    
          this.diagnosticSubscription = this.diagnosticsService.add(this.diagnostic()).subscribe(diagnostic=>{
            this.getConfirmation("Le diagnostic a bien été créé. ",diagnostic);
          });
      }else{
        this.formGroup.markAllAsTouched();
      }
      
    }
  }

  //Message de confirmation
  getConfirmation(message:string,diag:Diagnostic){
      this.previousPage = localStorage.getItem("previousPage")!;
      
      if(diag.id_diagnostic > 0){
        this.toaster.success(message);
        const path = "diagnostic-visualisation/"+diag.id_diagnostic+"/"+diag.slug;
        this.navigate(path,diag);
      }else{
        this.toaster.error("Erreur serveur");
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
    this.diagnostic.set(Object.assign(new Diagnostic(),payload));
   
  }

  ngOnDestroy(): void {

    this.diagnosticSubscription?.unsubscribe();
    this.actorsSub?.unsubscribe();
  }

  compareSites = (s1: Site, s2: Site) => s1 && s2 && s1.id_site === s2.id_site;

   //Récupère les acteurs des sites sélectionnés et crée le nom en fonction des sites
  getDiagName(sites:any){
    
    if(sites.length > 0){
      this.chosenSites= sites;
      let array:number[]=[];
      for(let i=0;i<sites.length;i++){
        array.push(sites[i].id_site);
      }
     
      let nom ="";
        
      for (let i =0;i<sites.length;i++){
        nom += sites[i].nom + " ";
        
      }
      nom = "Diagnostic - "+ nom + "- " + new Date().getFullYear();
      this.diagnostic().nom = nom;
      this.formGroup.get('nom')?.setValue(nom);
    }
  }

}
