import { CommonModule } from '@angular/common';
import { Component, effect, inject, input, Input, OnDestroy, signal } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { ActivatedRoute, Params, Router, RouterModule } from '@angular/router';
import { Acteur } from '@app/models/acteur.model';
import { Departement } from '@app/models/departement.model';
import { Diagnostic } from '@app/models/diagnostic.model';
import { Nomenclature } from '@app/models/nomenclature.model';
import { MatListModule } from '@angular/material/list';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { AlerteShowActorDetailsComponent } from '../../alertes/alerte-show-actor-details/alerte-show-actor-details.component';
import { MatCardModule } from '@angular/material/card';
import { Labels } from '@app/utils/labels';
import { AlerteStatutEntretienComponent } from '@app/components/alertes/alerte-statut-entretien/alerte-statut-entretien.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { forkJoin, Subscription } from 'rxjs';
import { DepartementService } from '@app/services/departement.service';
import { NomenclatureService } from '@app/services/nomenclature.service';
import { ActeurService } from '@app/services/acteur.service';
import { DiagnosticService } from '@app/services/diagnostic.service';
import { Site } from '@app/models/site.model';
import { SiteService } from '@app/services/sites.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { AlerteDiagnosticComponent } from '@app/components/alertes/alerte-diagnostic/alerte-diagnostic.component';

//Tableau des acteurs
@Component({
    selector: 'app-choix-acteurs',
    templateUrl: './choix-acteurs.component.html',
    styleUrls: ['./choix-acteurs.component.css'],
    imports: [CommonModule, MatTableModule, MatCheckboxModule, FormsModule, MatSelectModule, MatFormFieldModule, MatButtonModule, RouterModule, ReactiveFormsModule, FontAwesomeModule, MatListModule, MatCardModule, MatTooltipModule]
})
export class ChoixActeursComponent implements OnDestroy{
  
  actors = input<Acteur[]>([]);
  title: string="Choisir les acteurs";
  titleGetActors = "Récupérer les acteurs d'un précédent diagnostic sur les sites choisis";
  labels:Labels = new Labels();
  diagnostic = input<Diagnostic>(new Diagnostic());
  uniqueDiagnostics = signal<Diagnostic[]>([]);
  uniqueDepartments = signal<Departement[]>([]);
  uniqueCategories = signal<Nomenclature[]>([]);
  displayedColumns: string[] = ['identity', 'categories','state', 'structure','other_infos','choice',];
  btnToDiagnostic = "Résumé diagnostic";
  selectedDepartment = signal<Departement>(new Departement());
  selectedCategory = signal<Nomenclature>(new Nomenclature());
  selectedDiagnostic = signal<Diagnostic>(new Diagnostic());
  actorsSelected = signal<MatTableDataSource<Acteur>>(new MatTableDataSource());
  actorsOriginal = signal<Acteur[]>([]);
  diag = signal<Diagnostic>(new Diagnostic());
  hideFilters = input<boolean>(false);
  previousPage = "";
  reinitialisation = "Réinitialiser"
  btnToChooseLabel: string = "choisir";
  btnNewActorLabel = "Nouvel acteur";
  emptyChosenActorsTxt = "Vous n'avez pas encore choisi d'acteurs.";
  chosenActors:string[] = [this.emptyChosenActorsTxt]
  titleChooseActors="Acteurs choisis";
  private dialog = inject(MatDialog);
  no_creation = input<boolean>(false);
  private fb = inject(FormBuilder);
  private routeSub?:Subscription; 
  private siteSub?:Subscription; 
  private diagSub?:Subscription;
  private departementService = inject(DepartementService);
  private nomenclatureService = inject(NomenclatureService); 
  private actorService = inject(ActeurService);
  private diagnosticService = inject(DiagnosticService);
  uniqueActors = signal<Acteur[]>([]);
  slug:string ="";
  private siteService = inject(SiteService);
  routeParams = toSignal(inject(ActivatedRoute).params, { initialValue: {} });
  id_diagnostic = signal<number>(0);
  acteurs = signal<Acteur[]>([]);
  @Input({ required: true }) formGroup!: FormGroup;

  constructor(){
    effect(() => {
      this.previousPage = localStorage.getItem("previousPage")!;
      /* this.diagnostic = JSON.parse(localStorage.getItem("diagnostic")!) as Diagnostic; */
      this.acteurs.set(this.actors());
      if (this.diagnostic().id_diagnostic > 0){
        this.diag.set(this.diagnostic());
      }else{
        this.diag.set(JSON.parse(localStorage.getItem("diagnostic")!) as Diagnostic);
      }
      console.log(this.diag());
      this.formGroup = this.fb.group({
        
        acteurs: this.fb.control<Acteur[]>([], [Validators.required]),  
        
      });
      if (!this.no_creation()){
        
        /* this.actors.set(this.diagnostic.acteurs); */
        const { id_diagnostic, slug } = this.routeParams() as Params;
        const id = Number(id_diagnostic);
        this.id_diagnostic.set(id);
        const slugValue = slug as string;

        if (id && slugValue){
          const departments$ = this.departementService.getAll();
          const categories$ = this.nomenclatureService.getAllByType("categories");
          
          forkJoin([departments$,categories$]).subscribe(([departements,categories]) => {
            this.uniqueDepartments.set(departements);
            this.uniqueCategories.set(categories);
            this.getActors(this.diag().sites);
          })  
        }
         
      }

    });

    effect(() => {
      const actors = this.actors();
      if (actors.length > 0 && this.acteurs().length === 0) {
        this.acteurs.set(actors);
      }
    });

    effect(() => {
      const a = this.acteurs();
      if (a && a.length > 0 && this.formGroup.get('acteurs')?.value?.length === 0) {
        this.processActors();
      }
    });

    effect(() => {
      const selectedActors = this.acteurs().filter(a => a.selected);
      this.formGroup?.get('acteurs')?.setValue(selectedActors);
    });
  }

  compareActors = (a: Acteur, b: Acteur) => a?.id_acteur === b?.id_acteur;

  //Récupértation des données
  processActors(): void {
    
    if (this.diagnostic().id_diagnostic > 0) {
      this.chosenActors=[];
      for (let acteur of this.acteurs()) {
        this.addOrRemoveActor(acteur);
      }
    } 
  }

  //Filtres
  applyFilters() {
    let selectedCat = true;
    let selectedDep = true;
    let selectedDiag = true;
    if (this.selectedCategory().id_nomenclature == 0){
      
      selectedCat = false
    }
    if (this.selectedDepartment().id_departement == 0 ){
      selectedDep = false;

    }
    
    if(this.selectedDiagnostic().id_diagnostic == 0){
      selectedDiag=false;
    }

    this.actorsSelected().data = this.actorsOriginal().filter(actor => {
      
      const matchDep = !selectedDep || actor.commune?.departement?.nom_dep === this.selectedDepartment().nom_dep;
      const matchCat = !selectedCat || actor.categories?.some(cat => cat.id_nomenclature === this.selectedCategory().id_nomenclature);
      const matchDiag = !selectedDiag ||actor.diagnostic?.id_diagnostic === this.selectedDiagnostic().id_diagnostic;
      
      return matchDep && matchCat && matchDiag;
    });
    
    this.acteurs.set(this.actorsSelected().data);
    this.processActors();
  }

  //Réinitialise les filtres
  resetFilters() {
    this.selectedDepartment.set(new Departement());
    this.selectedCategory.set(new Nomenclature());
    this.acteurs.set(this.actorsOriginal());
    this.selectedDiagnostic.set(new Diagnostic());
    this.processActors();
  }

  //Modifie la liste des acteurs choisis
  addOrRemoveActor(actor:Acteur,is_creation?:boolean){
      if(is_creation){
        actor.selected = !actor.selected;
      }
      
      const selectedActors = this.acteurs().filter(a => a.selected);
      
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

  //Alerte de confirmation
  openAlert(actor:Acteur){
    this.dialog.open(AlerteStatutEntretienComponent, {
      data: {
        title: this.labels.modifyStateInterview,
        actor: actor,
        labels: this.labels
        
      }
    });
  }
  
  //Affiche l'alerte avec les infos supplémentaires
  showOtherInfos(actor:Acteur){
    this.dialog.open(AlerteShowActorDetailsComponent, {
              data: {
                title: this.labels.showMoreInfo,
                actor: actor,
                labels: this.labels
                
              }
    });
  }

  //Donne des valeurs à uniqueActors, uniqueDepartements et uniqueCategories
  instructionswithResults(acteurs:Acteur[]){
    
    this.uniqueActors.set(acteurs);
    
    for (let i=0;i<acteurs.length;i++){
      let dpt:Departement = acteurs[i].commune.departement;
      let dptExiste = this.uniqueDepartments().some(d => d.id_dep === dpt.id_dep);
      
      if (!dptExiste){
      
        this.uniqueDepartments.update(list => [...list, dpt]);
      }
      for (let j=0;j<acteurs[i].categories!.length;j++){
        let cat: Nomenclature = acteurs[i].categories![j];
        let catExiste = this.uniqueCategories().some(c => c.id_nomenclature === cat.id_nomenclature);
        
        if (!catExiste) {
        
          this.uniqueCategories.update(list => [...list, cat]);
        }
      }

    }
    this.actorService.sortByNameAndSelected(this.actorsOriginal());
    this.departementService.sortByName(this.uniqueDepartments());
    this.nomenclatureService.sortByName(this.uniqueCategories());
  }

  //Sélectionne les acteurs dans l'interface
  setActors(diag: Diagnostic) {
    // Ajoute les acteurs manquants à uniqueActors
    const acteursFromDiag = diag.acteurs || [];
    
    for (const acteur of acteursFromDiag) {
      const alreadyExists = this.uniqueActors().some(a => a.id_acteur === acteur.id_acteur);
      if (!alreadyExists) {
      
        this.uniqueActors.update(list => [...list, acteur]);
        
      }
    }

    // Remappage avec mise à jour des références
    const remappedActeurs = acteursFromDiag.map(act =>
      this.uniqueActors().find(a => a.id_acteur === act.id_acteur) || act
    );

    // Marquer les acteurs sélectionnés
    const selectedIds = new Set(remappedActeurs.map(a => a.id_acteur));
    this.uniqueActors().forEach(actor => {
      actor.selected = selectedIds.has(actor.id_acteur);
    });
  
    this.acteurs.set(this.uniqueActors());
    this.actorService.sortByNameAndSelected(this.acteurs());
    this.actorsOriginal.set(this.uniqueActors());
    this.processActors();
  }

  //Récupère les acteurs des sites sélectionnés et crée le nom en fonction des sites
  getActors(sites:Site[]){
    
    if(sites.length > 0){

      let array:number[]=[];
      for(let i=0;i<sites.length;i++){
        array.push(sites[i].id_site);
      }
      let json={
        id_sites:array
      }
      let nom ="";
        
      for (let i =0;i<sites.length;i++){
        nom += sites[i].nom + " ";
        
      }
      nom = "Diagnostic - "+ nom + "- " + new Date().getFullYear();
      
      
      this.diag().nom = nom;
      this.formGroup?.get('nom')?.setValue(nom);
      const diagnostics$ = this.diagnosticService.getAllBySites(json);
      const acteurs$ = this.actorService.getAllBySItes(json);
      this.siteSub = forkJoin([diagnostics$,acteurs$]).subscribe(([diagnostics,acteurs]) => {
        this.instructionswithResults(acteurs);
        
        this.setActors(this.diag());
        this.uniqueDiagnostics.set(diagnostics);
        
        
      });
    }
  }

  navigate= (path:string,diagnostic:Diagnostic,acteur?:Acteur):void =>{
    localStorage.setItem("fromActor","oui");
    localStorage.setItem("acteur",JSON.stringify(acteur));
    this.siteService.navigateAndCache(path,diagnostic);
  }
  
  //Enregistre les acteurs
  recordActors(){
    const selectedActors = this.acteurs().filter(a => a.selected);
    if (selectedActors.length > 0) {
      const newDiag = this.diag();
      newDiag.acteurs = selectedActors;
      const diagToSend = Diagnostic.fromJson(newDiag);
      console.log(diagToSend);
      this.diagnosticService.update(diagToSend).subscribe(updated => {
        this.setActors(updated);
        this.getConfirmation("Le diagnostic contient désormais ces informations :", updated, this.no_creation());
      });
    }
    
  }

  getConfirmation(message:string,diag:Diagnostic,no_creation?:boolean){
        this.previousPage = localStorage.getItem("previousPage")!;
     
        if (!no_creation){
          localStorage.setItem("fromActor","oui");
        }
        if(diag.id_diagnostic > 0){
          this.dialog.open(AlerteDiagnosticComponent, {
            data: {
              title: this.labels.addActors,
              message: message,
              labels: this.labels,
              diagnostic:diag,
              previousPage:this.previousPage,
              no_creation:no_creation
            }
          });
        }
        
  }

  ngOnDestroy(): void {
    this.diagSub?.unsubscribe();
    this.routeSub?.unsubscribe();
    this.siteSub?.unsubscribe();
  }
}
