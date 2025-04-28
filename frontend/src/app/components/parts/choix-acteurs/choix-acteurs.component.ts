import { CommonModule } from '@angular/common';
import { Component, inject, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormField, MatFormFieldModule } from '@angular/material/form-field';
import { MatSelect, MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { RouterModule } from '@angular/router';
import { Acteur } from '@app/models/acteur.model';
import { Departement } from '@app/models/departement.model';
import { Diagnostic } from '@app/models/diagnostic.model';
import { Nomenclature } from '@app/models/nomenclature.model';
import { Region } from '@app/models/region.model';
import { ActeurService } from '@app/services/acteur.service';

@Component({
  selector: 'app-choix-acteurs',
  templateUrl: './choix-acteurs.component.html',
  styleUrls: ['./choix-acteurs.component.css'],
  standalone:true,
  imports:[CommonModule,MatTableModule,MatCheckboxModule,FormsModule,MatSelectModule,MatFormFieldModule,MatButtonModule,RouterModule]
})
export class ChoixActeursComponent implements OnInit {
  @Input() actors: Acteur[]=[];
  title: string="Choisir les acteurs";
  titleGetActors = "Récupérer les acteurs d'un précédent diagnostic sur ce site";
  labels = {
    diagnosticsList:"",
    identity:"",
    region:"",
    department:"",
    category:"",
    status:"",
    structure:"",
    profile:"",
    telephone:"",
    mail:"",
    town:""
  };
  selectedDiagnostic: Diagnostic = new Diagnostic();
  uniqueDiagnostics: Diagnostic[] = [];
  uniqueRegions: Region[] = [];
  uniqueDepartments: Departement[] = [];
  uniqueCategories: Nomenclature[] = [];
  displayedColumns: string[] = ['identity', 'categories','status', 'structure','town','profile','telephone','mail','choice'];
  btnToDiagnostic = "Résumé diagnostic";
  private acteurService = inject(ActeurService);
  applyFilters() {
  throw new Error('Method not implemented.');
  }
  diag: any;
  titleChooseActors: any;
  selectedRegion: Region = new Region;
  selectedDepartment: Departement = new Departement();
  selectedCategory: Nomenclature = new Nomenclature();
 
  addOrRemoveActor(_t79: any) {
  throw new Error('Method not implemented.');
  }
  btnToChooseLabel: string = "choisir";
  navigate(arg0: string,arg1: any) {
    throw new Error('Method not implemented.');
  }
  diagnostic: Diagnostic = new Diagnostic();
  btnNewActorLabel = "Nouvel acteur";
  btnToChooseActors: any;
  ngOnInit(): void {
    console.log(localStorage.getItem("diagnostic"));
    this.labels = this.acteurService.labels;
  }

}
