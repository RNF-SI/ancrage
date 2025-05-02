import { CommonModule } from '@angular/common';
import { Component, inject, Input, OnInit } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
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
  imports:[CommonModule,MatTableModule,MatCheckboxModule,FormsModule,MatSelectModule,MatFormFieldModule,MatButtonModule,RouterModule,ReactiveFormsModule]
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
  @Input() selectedDepartment: Departement = new Departement();
  @Input() selectedCategory: Nomenclature = new Nomenclature();
  @Input() selectedDiagnostic: Diagnostic = new Diagnostic();
  @Input() actorsSelected: MatTableDataSource<Acteur>= new MatTableDataSource();
  @Input() actorsOriginal: Acteur[]=[];
  @Input() formGroup!:FormGroup;
  reinitialisation = "Réinitialiser"
  btnToChooseLabel: string = "choisir";
  btnNewActorLabel = "Nouvel acteur";
  emptyChosenActorsTxt = "Vous n'avez pas encore choisi d'acteurs.";
  chosenActors:string[] = [this.emptyChosenActorsTxt]
  titleChooseActors="Acteurs choisis";
 

  ngOnInit(): void {
    console.log(localStorage.getItem("diagnostic"));
    this.labels = this.acteurService.labels;
  }

  applyFilters() {
    let selectedCat = true;
    if (this.selectedCategory.id_nomenclature == 0){
      selectedCat = false
    }
    
    this.actorsSelected.data = this.actorsOriginal.filter(actor => {
      
      const matchDep = !this.selectedDepartment.nom_dep || actor.commune?.departement?.nom_dep === this.selectedDepartment.nom_dep;
      const matchCat = !selectedCat || actor.categories?.some(cat => cat.id_nomenclature === this.selectedCategory.id_nomenclature);
      const matchDiag = !this.selectedDiagnostic.id_diagnostic || actor.diagnostic?.id_diagnostic === this.selectedDiagnostic.id_diagnostic;
  
      return matchDep && matchCat && matchDiag;
    });
    
    this.actors = this.actorsSelected.data;
    console.log(this.actors);
  }

  resetFilters() {
    this.selectedDepartment = new Departement();
    this.selectedCategory = new Nomenclature();
    this.actors = this.actorsOriginal;
    this.selectedDiagnostic = new Diagnostic();
  }

  addOrRemoveActor(actor:Acteur){
      actor.selected = !actor.selected;
      const selectedActors = this.actors.filter(a => a.selected);
      this.formGroup?.get('acteurs')?.setValue(selectedActors);
      if (actor.selected){
        
        if(this.chosenActors.includes(this.emptyChosenActorsTxt)){
          this.chosenActors=[];
          
        }
        this.chosenActors.push(actor.nom + " "+ actor.prenom);
      }else{
        let iteration=0;
        /* for(let i=0;i<this.diagnostic.acteurs.length;i++){
          if(this.diagnostic.acteurs[i].id_acteur === actor.id_acteur){
           iteration = i;
           break;
          }
          
        }
        this.diagnostic.sites.splice(iteration,1); */

        for(let i=0;i<this.chosenActors.length;i++){
          if(this.chosenActors[i] === actor.nom+ " "+ actor.prenom){
           iteration = i;
           break;
          }
          
        }
        this.chosenActors.splice(iteration,1);
        if(this.chosenActors.length == 0){
          this.chosenActors.push(this.emptyChosenActorsTxt);
        }
      }

  }


}
