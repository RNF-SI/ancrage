import { CommonModule } from '@angular/common';
import { Component, inject, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormField, MatFormFieldModule } from '@angular/material/form-field';
import { MatSelect, MatSelectModule } from '@angular/material/select';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
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
  titleGetActors = "Récupérer les acteurs d'un précédent diagnostic sur les sites choisis";
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
  @Input() diagnostic: Diagnostic = new Diagnostic();
  @Input() uniqueDiagnostics: Diagnostic[] = [];
  @Input() uniqueDepartments: Departement[] = [];
  @Input() uniqueCategories: Nomenclature[] = [];
  displayedColumns: string[] = ['identity', 'categories','status', 'structure','town','profile','telephone','mail','choice'];
  btnToDiagnostic = "Résumé diagnostic";
  private acteurService = inject(ActeurService);
  diag: any;
  titleChooseActors: any;
  @Input() selectedDepartment: Departement = new Departement();
  @Input() selectedCategory: Nomenclature = new Nomenclature();
  @Input() selectedDiagnostic: Diagnostic = new Diagnostic();
  @Input() actorsSelected: MatTableDataSource<Acteur>= new MatTableDataSource();
  @Input() actorsOriginal: Acteur[]=[];
  reinitialisation = "Réinitialiser"
 
  addOrRemoveActor(_t79: any) {
  throw new Error('Method not implemented.');
  }
  btnToChooseLabel: string = "choisir";
  navigate(arg0: string,arg1: any) {
    throw new Error('Method not implemented.');
  }

  btnNewActorLabel = "Nouvel acteur";
  btnToChooseActors: any;
  ngOnInit(): void {
    console.log(localStorage.getItem("diagnostic"));
    this.labels = this.acteurService.labels;
  }

  applyFilters() {
    let selectedCat = true;
    if (this.selectedCategory.id_nomenclature == 0){
      selectedCat = false
    }
    console.log(selectedCat);
    this.actorsSelected.data = this.actorsOriginal.filter(actor => {
      console.log(actor.commune?.departement?.nom_dep);
      const matchDep = !this.selectedDepartment.nom_dep || actor.commune?.departement?.nom_dep === this.selectedDepartment.nom_dep;
      console.log(matchDep);
      const matchCat = !selectedCat || actor.categories?.some(cat => cat.id_nomenclature === this.selectedCategory.id_nomenclature);
      
      return matchDep && matchCat;
    });
    console.log(this.actorsSelected.data);
    this.actors = this.actorsSelected.data;
  }

  resetFilters() {
    this.selectedDepartment = new Departement();
    this.selectedCategory = new Nomenclature();
    this.actors = this.actorsOriginal;
  }


}
