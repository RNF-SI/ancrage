import { Component } from '@angular/core';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { CommonModule } from '@angular/common';
import { Site } from '@app/models/site.model';
import { FormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { Nomenclature } from '@app/models/nomenclature.model';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-site',
  templateUrl: './site.component.html',
  styleUrls: ['./site.component.css'],
  standalone:true,
  imports:[MatInputModule,MatFormFieldModule,CommonModule,FormsModule,MatSelectModule,MatButtonModule]
})
export class SiteComponent {
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
}
