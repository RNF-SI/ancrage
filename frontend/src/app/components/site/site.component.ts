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
		nom:['', [Validators.required]],
		habitats: [[], [Validators.required]],
		type: [[], [Validators.required]],
		position_y: [this.latitude, [Validators.required,Validators.pattern('^(\\+|-)?(?:90(?:\.0{1,6})?|(?:[0-9]|[1-8][0-9])(?:\.[0-9]{1,6})?)$')]],
		position_x: [this.longitude, [Validators.required,Validators.pattern('^(\\+|-)?(?:180(?:(?:\.0{1,6})?)|(?:[0-9]|[1-9][0-9]|1[0-7][0-9])(?:(?:\.[0-9]{1,6})?))$')]]
		
	});
  site:Site = Object.assign(new Site(),this.formGroup.value);
  ngOnInit(): void {
    this.nomenclatureSubscription = this.nomenclatureService.getAllByType(this.mnemoHabitats).subscribe(habitats => {
          
        console.log(habitats);
        return this.uniqueHabitats = habitats;
    });
    this.nomenclatureSubscription = this.nomenclatureService.getAllByType(this.mnemoStatuts).subscribe(statuts => {
          
      console.log(statuts)
      return this.uniqueStatuts = statuts;
    });
  }

  changeLocation(){
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
  }
}
