import { Component, effect, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { CommonModule } from '@angular/common';
import { Site } from '@app/models/site.model';
import { FormsModule, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { Nomenclature } from '@app/models/nomenclature.model';
import { MatButtonModule } from '@angular/material/button';
import { NomenclatureService } from '@app/services/nomenclature.service';
import { Subscription } from 'rxjs/internal/Subscription';
import { SiteService } from '@app/services/sites.service';
import { MapComponent } from "../parts/map/map.component";
import { ActivatedRoute, Params } from '@angular/router';
import { forkJoin, Observable } from 'rxjs';
import { Diagnostic } from '@app/models/diagnostic.model';
import { Departement } from '@app/models/departement.model';
import { DepartementService } from '@app/services/departement.service';
import { MatDialog } from '@angular/material/dialog';
import { AlerteSiteComponent } from '../alertes/alerte-site/alerte-site.component';
import { AuthService } from '@app/home-rnf/services/auth-service.service';
import { Labels } from '@app/utils/labels';
import { toSignal } from '@angular/core/rxjs-interop';

//Modifie ou crée un site
@Component({
    selector: 'app-site',
    templateUrl: './site.component.html',
    styleUrls: ['./site.component.css'],
    imports: [MatInputModule, MatFormFieldModule, CommonModule, FormsModule, MatSelectModule, MatButtonModule, MapComponent, ReactiveFormsModule]
})
export class SiteComponent implements OnDestroy{
  
  sites:Site[]=[];
  titleSite="Nouveau site";
  titleModif="Modification du site";
  labels = new Labels();
  uniqueHabitats = signal<Nomenclature[]>([]);
  uniqueStatuts = signal<Nomenclature[]>([]);
  uniqueDepartements = signal<Departement[]>([]);
  latitude="";
  longitude="";
  private nomenclatureService = inject(NomenclatureService);
  private siteService = inject(SiteService)
  private nomenclatureSubscription!: Subscription;
  private siteSubscription!: Subscription;
  mnemoHabitats = "habitats";
  mnemoStatuts = "statut";
  private fb = inject(FormBuilder);
  formGroup = this.fb.group({
    id_site: [0],
    nom: ['', [Validators.required]],
    /* habitats: this.fb.control<Nomenclature[]>([], [Validators.required]),   */
    type: this.fb.control<Nomenclature | null>(null, [Validators.required]),
    departements: this.fb.control<Departement[]>([], [Validators.required]),  
    slug:[""],
    position_y: [this.latitude, [Validators.required,Validators.pattern('^(\\+|-)?(?:90(?:\.0{1,6})?|(?:[0-9]|[1-8][0-9])(?:\.[0-9]{1,6})?)$')]],
		position_x: [this.longitude, [Validators.required,Validators.pattern('^(\\+|-)?(?:180(?:(?:\.0{1,6})?)|(?:[0-9]|[1-9][0-9]|1[0-7][0-9])(?:(?:\.[0-9]{1,6})?))$')]]
  });
  site = signal<Site>(new Site());
  routeSubscription?: Subscription;
  route = inject(ActivatedRoute)
  slug = signal<string>("");
  id_site = signal<number>(0);
  changePosition = true;
  diagnostic:Diagnostic = new Diagnostic();
  private departementService = inject(DepartementService);
  private dialog = inject(MatDialog);
  private authService = inject(AuthService);
  user_id = signal<number>(0);
  previousPage="";
  showMap=true;
  mapInstanceKey = Date.now();
  routeParams = toSignal(this.route.params, { initialValue: {} });

  constructor() {
    effect(() => {
      this.mapInstanceKey = Date.now();
      this.user_id.set(this.authService.getCurrentUser().id_role);
      this.diagnostic = JSON.parse(localStorage.getItem("diagnostic")!);    
      
      const { id_site, slug } = this.routeParams() as Params;
      
      const id = Number(id_site);
      const slugValue = slug as string;
      this.id_site.set(id);
      this.slug.set(slugValue);
      const habitats$ = this.nomenclatureService.getAllByType(this.mnemoHabitats);
      const statuts$ = this.nomenclatureService.getAllByType(this.mnemoStatuts);
      const departements$ = this.departementService.getAll();
      //Modification
      if (id && slugValue) {
        const site$ = this.siteService.get(this.id_site(),this.slug());
        this.previousPage = localStorage.getItem("previousPage")!;
        forkJoin([habitats$, statuts$, site$,departements$]).subscribe(([habitats, statuts, site,departements]) => {
          this.uniqueHabitats.set(habitats);
          this.uniqueStatuts.set(statuts);
          this.uniqueDepartements.set(departements);
          this.departementService.sortByName(this.uniqueDepartements());
          this.site.set(site);
          /* this.site.habitats = (this.site.habitats || []).map(hab =>
            this.uniqueHabitats.find(uh => uh.id_nomenclature === hab.id_nomenclature) || hab
          ); */
          this.site().departements = (this.site().departements|| []).map(dpt =>
            this.uniqueDepartements().find(ud => ud.id_departement === dpt.id_departement) || dpt
          );
          this.site().type = this.uniqueStatuts().find(stat => stat.id_nomenclature === this.site().type?.id_nomenclature) || this.site().type;
  
          this.formGroup.patchValue({
            id_site: this.site().id_site,
            nom: this.site().nom,
            /* habitats: this.site.habitats, */
            departements: this.site().departements,
            type: this.site().type,
            position_y: this.site().position_y,
            position_x: this.site().position_x,
            slug: this.site().slug
          });
          this.titleSite = this.titleModif;
        });
      } else {
        this.previousPage = localStorage.getItem("pageDiagCreation")!;
        //Création
        forkJoin([/* habitats$, */ statuts$,departements$]).subscribe(([/* habitats, */ statuts,departements]) => {
          /* this.uniqueHabitats = habitats; */
          this.uniqueStatuts.set(statuts);
          this.uniqueDepartements.set(departements);
          this.departementService.sortByName(this.uniqueDepartements());
        });
      }
      
    });
  }
 
  compareNomenclatures(o1: Nomenclature, o2: Nomenclature): boolean {
    return o1 && o2 ? o1.id_nomenclature === o2.id_nomenclature : o1 === o2;
  }

  compareDepartements(o1: Departement, o2: Departement): boolean {
    return o1 && o2 ? o1.id_departement === o2.id_departement: o1 === o2;
  }

  //Enregistre le site
  recordSite(event: Event){
    
    event.preventDefault();
    
    this.site.set(Object.assign(new Site(),this.formGroup.value))
    if(this.formGroup.valid){
      //Ajout
      if (this.site().id_site == 0){
        this.site().created_by=this.user_id();
        this.siteSubscription = this.siteService.add(this.site()).subscribe(site=>{
          this.getConfirmation("Le site suivant vient d'être créé dans la base de données et a été ajouté au diagnostic :",site,"pageDiagCreation");
        });
      }else{
        //Modification
        this.site().modified_by=this.user_id();
        this.siteSubscription = this.siteService.update(this.site()).subscribe(site=>{
          this.getConfirmation("Le site suivant vient d'être modifié dans la base de données et a été ajouté au diagnostic :",site,"previousPage");
        });
      }
    }
  }

  //Affiche le message de confirmation
  getConfirmation(message:string,site:Site,page:string){
    this.diagnostic.sites.push(site);
    this.previousPage = localStorage.getItem(page)!;
    this.dialog.open(AlerteSiteComponent, {
      data: {
        title: this.titleSite,
        message: message,
        site: site,
        labels: this.labels,
        diagnostic:this.diagnostic,
        previousPage:this.previousPage
      }
    });
  }
  navigate(path:string,diagnostic:Diagnostic){
    this.siteService.navigateAndCache(path,diagnostic,undefined,true);
  }
  ngOnDestroy(): void {
    this.nomenclatureSubscription?.unsubscribe();
    this.siteSubscription?.unsubscribe();
   
  }
}


