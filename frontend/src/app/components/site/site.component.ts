import { Component, inject, OnDestroy, OnInit } from '@angular/core';
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
import { ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';
import { Diagnostic } from '@app/models/diagnostic.model';
import { Departement } from '@app/models/departement.model';
import { DepartementService } from '@app/services/departement.service';
import { MatDialog } from '@angular/material/dialog';
import { AlerteSiteComponent } from '../parts/alerte-site/alerte-site.component';
import { AuthService } from '@app/home-rnf/services/auth-service.service';
import { Labels } from '@app/utils/labels';



@Component({
  selector: 'app-site',
  templateUrl: './site.component.html',
  styleUrls: ['./site.component.css'],
  standalone:true,
  imports: [MatInputModule, MatFormFieldModule, CommonModule, FormsModule, MatSelectModule, MatButtonModule, MapComponent,ReactiveFormsModule]
})
export class SiteComponent implements OnInit,OnDestroy{
  
  sites:Site[]=[];
  titleSite="Nouveau site";
  titleModif="Modification du site";

  
  labels = new Labels();
  uniqueHabitats:Nomenclature[]=[];
  uniqueStatuts:Nomenclature[]=[];
  uniqueDepartements:Departement[]=[];
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
    id_site: [0, [Validators.required]],
    nom: ['', [Validators.required]],
    habitats: this.fb.control<Nomenclature[]>([], [Validators.required]),  
    type: this.fb.control<Nomenclature | null>(null, [Validators.required]),
    departements: this.fb.control<Departement[]>([], [Validators.required]),  
    position_y: [this.latitude, [Validators.required,Validators.pattern('^(\\+|-)?(?:90(?:\.0{1,6})?|(?:[0-9]|[1-8][0-9])(?:\.[0-9]{1,6})?)$')]],
		position_x: [this.longitude, [Validators.required,Validators.pattern('^(\\+|-)?(?:180(?:(?:\.0{1,6})?)|(?:[0-9]|[1-9][0-9]|1[0-7][0-9])(?:(?:\.[0-9]{1,6})?))$')]]
  });
  site:Site = Object.assign(new Site(),this.formGroup.value);
  routeSubscription: any;
  route = inject(ActivatedRoute)
  id_site: number = 1;
  monsterService: any;
  monster: any;
  changePosition = true;
  diagnostic:Diagnostic = new Diagnostic();
  private departementService = inject(DepartementService);
  private dialog = inject(MatDialog);
  private authService = inject(AuthService);
  user_id=0;
  previousPage="";

  ngOnInit(): void {
    this.previousPage = localStorage.getItem("previousPage")!;
    this.user_id = this.authService.getCurrentUser().id_role;
    console.log(this.previousPage);
    if(localStorage.getItem("diagnostic")){
      this.diagnostic = JSON.parse(localStorage.getItem("diagnostic")!)
    }
    this.routeSubscription = this.route.params.subscribe((params: any) => {
      const id_site = params['id_site'];  
  
      const habitats$ = this.nomenclatureService.getAllByType(this.mnemoHabitats);
      const statuts$ = this.nomenclatureService.getAllByType(this.mnemoStatuts);
      const departements$ = this.departementService.getAll();

      if (id_site) {
        // 🔥 Charger les habitats, statuts ET site
        const site$ = this.siteService.get(id_site);
  
        forkJoin([habitats$, statuts$, site$,departements$]).subscribe(([habitats, statuts, site,departements]) => {
          this.uniqueHabitats = habitats;
          this.uniqueStatuts = statuts;
          this.uniqueDepartements = departements;
          this.departementService.sortByName(this.uniqueDepartements);
          this.site = site;
          this.site.habitats = (this.site.habitats || []).map(hab =>
            this.uniqueHabitats.find(uh => uh.id_nomenclature === hab.id_nomenclature) || hab
          );
          this.site.departements = (this.site.departements|| []).map(dpt =>
            this.uniqueDepartements.find(ud => ud.id_departement === dpt.id_departement) || dpt
          );
          this.site.type = this.uniqueStatuts.find(stat => stat.id_nomenclature === this.site.type?.id_nomenclature) || this.site.type;
  
          this.formGroup.patchValue({
            id_site: this.site.id_site,
            nom: this.site.nom,
            /* habitats: this.site.habitats, */
            departements: this.site.departements,
            type: this.site.type,
            position_y: this.site.position_y,
            position_x: this.site.position_x
          });
          this.titleSite = this.titleModif;
        });
      } else {

        forkJoin([/* habitats$, */ statuts$,departements$]).subscribe(([/* habitats, */ statuts,departements]) => {
          /* this.uniqueHabitats = habitats; */
          this.uniqueStatuts = statuts;
          this.uniqueDepartements = departements;
          this.departementService.sortByName(this.uniqueDepartements);
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

  recordSite(event: Event){
    
    event.preventDefault();
    
    this.site = Object.assign(new Site(),this.formGroup.value);
    
    if (this.site.id_site == 0){
      this.site.created_by=this.user_id;
      this.siteSubscription = this.siteService.add(this.site).subscribe(site=>{
        this.diagnostic.sites.push(site);
        localStorage.setItem("diagnostic",JSON.stringify(this.diagnostic));
        this.dialog.open(AlerteSiteComponent, {
          data: {
            title: this.titleSite,
            message: "Le site suivant vient d'être créé dans la base de données et a été ajouté au diagnostic :",
            site: site,
            labels: this.labels,
            diagnostic:this.diagnostic,
            previousPage:this.previousPage
          }
        });
      });
    }else{
      this.site.modified_by=this.user_id;
      this.siteSubscription = this.siteService.update(this.site).subscribe(site=>{
        this.diagnostic.sites.push(site);
        localStorage.setItem("diagnostic",JSON.stringify(this.diagnostic));
        this.dialog.open(AlerteSiteComponent, {
          data: {
            title: this.titleModif,
            message: "Le site suivant vient d'être modifié dans la base de données et a été ajouté au diagnostic :",
            site: site,
            labels: this.labels,
            diagnostic:this.diagnostic,
            previousPage:this.previousPage
          }
        });
      });
    }
   
  }

  navigate(path:string,diagnostic:Diagnostic){
    this.siteService.navigateAndReload(path,diagnostic);
  }
  ngOnDestroy(): void {
    this.nomenclatureSubscription?.unsubscribe();
    this.siteSubscription?.unsubscribe();
    this.routeSubscription?.unsubscribe();
  }
}
