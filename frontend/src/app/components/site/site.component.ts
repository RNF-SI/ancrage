import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { CommonModule } from '@angular/common';
import { Site } from '@app/models/site.model';
import { FormsModule, FormGroup,FormControl, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { Nomenclature } from '@app/models/nomenclature.model';
import { MatButtonModule } from '@angular/material/button';
import { NomenclatureService } from '@app/services/nomenclature.service';
import { Subscription } from 'rxjs/internal/Subscription';
import { SiteService } from '@app/services/sites.service';
import { MapComponent } from "../map/map.component";
import { ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';


@Component({
  selector: 'app-site',
  templateUrl: './site.component.html',
  styleUrls: ['./site.component.css'],
  standalone:true,
  imports: [MatInputModule, MatFormFieldModule, CommonModule, FormsModule, MatSelectModule, MatButtonModule, MapComponent,ReactiveFormsModule]
})
export class SiteComponent implements OnInit,OnDestroy{
  sites:Site[]=[];
  titleSite="Créer un site";
  regionLabel = "Régions";
  departmentLabel ="Départements";
  housingLabel= "Habitats";
  statusLabel ="Statut";
  nameLabel = "Nom"; 
  latitudeLabel = "Latitude";
  longitudeLabel = "Longitude";
  btnRecordLabel = "Enregistrer";
  btnPreviousStepLabel = "Revenir à l'étape précédente";
  uniqueHabitats:Nomenclature[]=[];
  uniqueStatuts:Nomenclature[]=[];
  latitude="47.316669";
  longitude="5.01667";
  private nomenclatureService = inject(NomenclatureService);
  private siteService = inject(SiteService)
  private nomenclatureSubscription!: Subscription;
  private siteSubscription!: Subscription;
  mnemoHabitats = "habitats";
  mnemoStatuts = "statut";
  private fb = inject(FormBuilder);
  formGroup = this.fb.group({
    nom: ['', [Validators.required]],
    habitats: this.fb.control<Nomenclature[]>([], [Validators.required]),  
    type: this.fb.control<Nomenclature | null>(null, [Validators.required]),
    position_y: [this.latitude, [Validators.required,Validators.pattern('^(\\+|-)?(?:90(?:\.0{1,6})?|(?:[0-9]|[1-8][0-9])(?:\.[0-9]{1,6})?)$')]],
		position_x: [this.longitude, [Validators.required,Validators.pattern('^(\\+|-)?(?:180(?:(?:\.0{1,6})?)|(?:[0-9]|[1-9][0-9]|1[0-7][0-9])(?:(?:\.[0-9]{1,6})?))$')]]
  });
  site:Site = Object.assign(new Site(),this.formGroup.value);
  routeSubscription: any;
  route = inject(ActivatedRoute)
  id_site: number = 1;
  monsterService: any;
  monster: any;
  
  ngOnInit(): void {
    this.routeSubscription = this.route.params.subscribe((params: any) => {
      const id_site = params['id_site'];  // 💡 id_site récupéré
  
      const habitats$ = this.nomenclatureService.getAllByType(this.mnemoHabitats);
      const statuts$ = this.nomenclatureService.getAllByType(this.mnemoStatuts);
  
      if (id_site) {
        // 🔥 Charger les habitats, statuts ET site
        const site$ = this.siteService.get(id_site);
  
        forkJoin([habitats$, statuts$, site$]).subscribe(([habitats, statuts, site]) => {
          this.uniqueHabitats = habitats;
          this.uniqueStatuts = statuts;
          this.site = site;
          
          // 🔥 Synchroniser les habitats
          this.site.habitats = (this.site.habitats || []).map(hab =>
            this.uniqueHabitats.find(uh => uh.id_nomenclature === hab.id_nomenclature) || hab
          );
  
          // 🔥 Synchroniser le type
          this.site.type = this.uniqueStatuts.find(stat => stat.id_nomenclature === this.site.type?.id_nomenclature) || this.site.type;
  
          // 🔥 Patch le formulaire
          this.formGroup.patchValue({
            nom: this.site.nom,
            habitats: this.site.habitats,
            type: this.site.type,
            position_y: this.site.position_y,
            position_x: this.site.position_x
          });
          this.changeLocation();
        });
      } else {
        // 🔥 Charger seulement habitats et statuts si pas d'id_site
        forkJoin([habitats$, statuts$]).subscribe(([habitats, statuts]) => {
          this.uniqueHabitats = habitats;
          this.uniqueStatuts = statuts;
        });
      }
    });
  }
 
  compareNomenclatures(o1: Nomenclature, o2: Nomenclature): boolean {
    return o1 && o2 ? o1.id_nomenclature === o2.id_nomenclature : o1 === o2;
  }

  changeLocation(){
    console.log(this.formGroup.get('position_y')?.valid);
    if(this.formGroup.get('position_y')?.valid && this.formGroup.get('position_x')?.valid){
      
      this.sites=[];
      this.site = Object.assign(new Site(),this.formGroup.value);
      this.sites.push(this.site);
    }
  }

  recordSite(event: Event){
    
    event.preventDefault();
    this.changeLocation();
    this.site = Object.assign(new Site(),this.formGroup.value);
    console.log(this.site)
    this.siteSubscription = this.siteService.add(this.site).subscribe(site=>{
      console.log(site);
    });
  }

  ngOnDestroy(): void {
    this.nomenclatureSubscription?.unsubscribe();
    this.siteSubscription.unsubscribe();
    this.routeSubscription.unsubscribe();
  }
}
