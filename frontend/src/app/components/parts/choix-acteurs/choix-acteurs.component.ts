import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, inject, Input, OnInit, SimpleChanges } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { MatFormField, MatFormFieldModule } from '@angular/material/form-field';
import { MatSelect, MatSelectModule } from '@angular/material/select';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { RouterModule } from '@angular/router';
import { Acteur } from '@app/models/acteur.model';
import { Departement } from '@app/models/departement.model';
import { Diagnostic } from '@app/models/diagnostic.model';
import { Nomenclature } from '@app/models/nomenclature.model';
import { MatListModule } from '@angular/material/list';
import { ActeurService } from '@app/services/acteur.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { AlerteShowActorDetailsComponent } from '../alerte-show-actor-details/alerte-show-actor-details.component';

@Component({
  selector: 'app-choix-acteurs',
  templateUrl: './choix-acteurs.component.html',
  styleUrls: ['./choix-acteurs.component.css'],
  standalone:true,
  imports:[CommonModule,MatTableModule,MatCheckboxModule,FormsModule,MatSelectModule,MatFormFieldModule,MatButtonModule,RouterModule,ReactiveFormsModule,FontAwesomeModule,MatListModule]
})
export class ChoixActeursComponent implements AfterViewInit {
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
    town:"",
    state:""
  };
  @Input() diagnostic: Diagnostic = new Diagnostic();
  @Input() uniqueDiagnostics: Diagnostic[] = [];
  @Input() uniqueDepartments: Departement[] = [];
  @Input() uniqueCategories: Nomenclature[] = [];
  displayedColumns: string[] = ['identity', 'categories','state', 'structure','other_infos','choice',];
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
  private dialog = inject(MatDialog);
  is_creation = false;

  ngOnChanges(changes: SimpleChanges): void {
      if (changes['actors'] && this.actors && this.actors.length > 0) {
        console.log(this.diagnostic.id_diagnostic);
        if(this.diagnostic.id_diagnostic!=0){
          console.log(this.actors);
          for (let i = 0;i<this.actors.length;i++){
              
              this.addOrRemoveActor(this.actors[i]);
        
          }
        }
      }
  }

  ngAfterViewInit(): void {
    console.log(localStorage.getItem("diagnostic"));
    this.labels = this.acteurService.labels;
    
  }

  applyFilters() {
    let selectedCat = true;
    if (this.selectedCategory.id_nomenclature == 0){
      selectedCat = false
    }
    console.log(this.selectedDiagnostic);
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

  addOrRemoveActor(actor:Acteur,is_creation?:boolean){
      if(is_creation){
        actor.selected = !actor.selected;
      }
      
      const selectedActors = this.actors.filter(a => a.selected);
      console.log(selectedActors);
      this.formGroup?.get('acteurs')?.setValue(selectedActors);
      if (actor.selected){
        console.log(actor);
        
          if(this.chosenActors.includes(this.emptyChosenActorsTxt)){
            this.chosenActors=[];
            
          }
        
        
        this.chosenActors.push(actor.nom + " "+ actor.prenom);
        console.log(this.chosenActors);
      }else{
        if (is_creation){
          let iteration=0;
          console.log('2');

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
  
  showOtherInfos(actor:Acteur){
    this.dialog.open(AlerteShowActorDetailsComponent, {
              data: {
                title: "Autres informations",
                actor: actor,
                labels: this.labels
                
              }
    });
  }

}
