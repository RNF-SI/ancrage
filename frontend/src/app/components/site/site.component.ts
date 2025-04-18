import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { CommonModule } from '@angular/common';
import { Site } from '@app/models/site.model';
import { FormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { Nomenclature } from '@app/models/nomenclature.model';
import { MatButtonModule } from '@angular/material/button';
import { NomenclatureService } from '@app/services/nomenclature.service';
import { Subscription } from 'rxjs/internal/Subscription';
import { SiteService } from '@app/services/sites.service';

@Component({
  selector: 'app-site',
  templateUrl: './site.component.html',
  styleUrls: ['./site.component.css'],
  standalone:true,
  imports:[MatInputModule,MatFormFieldModule,CommonModule,FormsModule,MatSelectModule,MatButtonModule]
})
export class SiteComponent implements OnInit,OnDestroy{

  site = new Site();
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
  private nomenclatureService = inject(NomenclatureService);
  private siteService = inject(SiteService)
  private nomenclatureSubscription!: Subscription;
  private siteSubscription!: Subscription;

  ngOnInit(): void {
    this.nomenclatureSubscription = this.nomenclatureService.getAllByType("habitats").subscribe(habitats => {
          
        console.log(habitats);
        return this.uniqueHabitats = habitats;
    });
    this.nomenclatureSubscription = this.nomenclatureService.getAllByType("statut").subscribe(statuts => {
          
      console.log(statuts)
      return this.uniqueStatuts = statuts;
    });
  }

  recordSite(){
    console.log(this.site);
    this.siteSubscription = this.siteService.add(this.site).subscribe(site=>{
      console.log(site);
    });
  }

  ngOnDestroy(): void {
    this.nomenclatureSubscription?.unsubscribe();
  }
}
