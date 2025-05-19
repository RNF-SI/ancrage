import { CommonModule } from '@angular/common';
import { Component, inject, Input, OnInit, SimpleChanges } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Acteur } from '@app/models/acteur.model';
import { Departement } from '@app/models/departement.model';
import { Diagnostic } from '@app/models/diagnostic.model';
import { Nomenclature } from '@app/models/nomenclature.model';
import { MatListModule } from '@angular/material/list';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { AlerteShowActorDetailsComponent } from '../../alertes/alerte-show-actor-details/alerte-show-actor-details.component';
import { MatCardModule } from '@angular/material/card';
import { Labels } from '@app/utils/labels';
import { DiagnosticStoreService } from '@app/services/diagnostic-store.service';
import { AlerteStatutEntretienComponent } from '@app/components/alertes/alerte-statut-entretien/alerte-statut-entretien.component';

@Component({
  selector: 'app-choix-acteurs',
  templateUrl: './choix-acteurs.component.html',
  styleUrls: ['./choix-acteurs.component.css'],
  standalone:true,
  imports:[CommonModule,MatTableModule,MatCheckboxModule,FormsModule,MatSelectModule,MatFormFieldModule,MatButtonModule,RouterModule,ReactiveFormsModule,FontAwesomeModule,MatListModule,MatCardModule]
})
export class ChoixActeursComponent implements OnInit {
  @Input() actors: Acteur[]=[];
  title: string="Choisir les acteurs";
  titleGetActors = "Récupérer les acteurs d'un précédent diagnostic sur les sites choisis";
  labels:Labels = new Labels();
  @Input() diagnostic: Diagnostic = new Diagnostic();
  @Input() uniqueDiagnostics: Diagnostic[] = [];
  @Input() uniqueDepartments: Departement[] = [];
  @Input() uniqueCategories: Nomenclature[] = [];
  displayedColumns: string[] = ['identity', 'categories','state', 'structure','other_infos','choice',];
  btnToDiagnostic = "Résumé diagnostic";
  @Input() selectedDepartment: Departement = new Departement();
  @Input() selectedCategory: Nomenclature = new Nomenclature();
  @Input() selectedDiagnostic: Diagnostic = new Diagnostic();
  @Input() actorsSelected: MatTableDataSource<Acteur>= new MatTableDataSource();
  @Input() actorsOriginal: Acteur[]=[];
  @Input() formGroup!:FormGroup;
  @Input() hideFilters:boolean = false;
  @Input() navigate!: (path:string,diagnostic:Diagnostic)=>void;
  @Input() previousPage="";
  reinitialisation = "Réinitialiser"
  btnToChooseLabel: string = "choisir";
  btnNewActorLabel = "Nouvel acteur";
  emptyChosenActorsTxt = "Vous n'avez pas encore choisi d'acteurs.";
  chosenActors:string[] = [this.emptyChosenActorsTxt]
  titleChooseActors="Acteurs choisis";
  private dialog = inject(MatDialog);
  is_creation = false;
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private diagnosticStoreService = inject(DiagnosticStoreService);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['actors'] && this.actors && this.actors.length > 0) {
      this.processActors();
    }
  }

  processActors(): void {
    
    if (this.diagnostic.id_diagnostic > 0) {
      this.chosenActors=[];
      for (let acteur of this.actors) {
        this.addOrRemoveActor(acteur);
      }
    } 
  }

  ngOnInit(): void {
   
    
  }

  applyFilters() {
    let selectedCat = true;
    let selectedDep = true;
    let selectedDiag = false;
    if (this.selectedCategory.id_nomenclature == 0){
      
      selectedCat = false
    }
    if (this.selectedDepartment.id_departement == 0 ){
      selectedDep = false;

    }
    
    if(this.selectedDiagnostic.id_diagnostic == 0){
      selectedDiag=false;
    }

    this.actorsSelected.data = this.actorsOriginal.filter(actor => {
      
      const matchDep = !selectedDep || actor.commune?.departement?.nom_dep === this.selectedDepartment.nom_dep;
      const matchCat = !selectedCat || actor.categories?.some(cat => cat.id_nomenclature === this.selectedCategory.id_nomenclature);
      const matchDiag = !this.selectedDiagnostic.id_diagnostic ||actor.diagnostic?.id_diagnostic === this.selectedDiagnostic.id_diagnostic;
      
      return matchDep && matchCat && matchDiag;
    });
    
    this.actors = this.actorsSelected.data;
    this.processActors();
  }

  resetFilters() {
    this.selectedDepartment = new Departement();
    this.selectedCategory = new Nomenclature();
    this.actors = this.actorsOriginal;
    this.selectedDiagnostic = new Diagnostic();
    this.processActors();
  }

  addOrRemoveActor(actor:Acteur,is_creation?:boolean){
      if(is_creation){
        actor.selected = !actor.selected;
      }
      
      const selectedActors = this.actors.filter(a => a.selected);
      
      this.formGroup?.get('acteurs')?.setValue(selectedActors);
      if (actor.selected){
        
        if(this.chosenActors.includes(this.emptyChosenActorsTxt)){
          this.chosenActors=[];
          
        }
        
        this.chosenActors.push(actor.nom + " "+ actor.prenom);
       
      }else{
        if (is_creation){
          let iteration=0;

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

  navigateToActor(path:string,diagnostic:Diagnostic){
    diagnostic = Object.assign(new Diagnostic(),this.formGroup.value);
    localStorage.setItem("previousPage",this.router.url);
    this.diagnosticStoreService.setDiagnostic(diagnostic);
    this.router.navigate([path]);
  }

  openAlert(actor:Acteur){
    this.dialog.open(AlerteStatutEntretienComponent, {
      data: {
        title: "Modifier l'état de l'entretien",
        actor: actor,
        labels: this.labels
        
      }
    });
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
