import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, input, Input, OnDestroy, output, signal } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
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
import { MatExpansionModule } from '@angular/material/expansion';
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
import { StateService } from '@app/services/state.service';
import { AlerteSuppressionActeurComponent } from '@app/components/alertes/alerte-suppression-acteur/alerte-suppression-acteur.component';

//Tableau des acteurs
@Component({
    selector: 'app-choix-acteurs',
    templateUrl: './choix-acteurs.component.html',
    styleUrls: ['./choix-acteurs.component.css'],
    imports: [
      CommonModule, 
      MatTableModule, 
      MatCheckboxModule, 
      FormsModule, 
      MatSelectModule, 
      MatFormFieldModule,
      MatInputModule,
      MatButtonModule, 
      RouterModule, 
      ReactiveFormsModule, 
      FontAwesomeModule, 
      MatListModule, 
      MatCardModule, 
      MatTooltipModule,
      MatExpansionModule
    ]
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
  private stateService = inject(StateService);
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
  router = inject(Router);
  delete = output<Acteur>();
  /** Émis lorsque la liste filtrée change (pour la carte). */
  filteredActorsChange = output<Acteur[]>();

  // Filtres pour la liste acteurs (mode expansion panels)
  filterSearch = signal('');
  filterCategoryIds = signal<number[]>([]);
  filterProfilIds = signal<number[]>([]);
  filterStatutEntretienIds = signal<number[]>([]);

  /** Catégories distinctes issues des acteurs (pour le filtre). */
  filterCategoriesOptions = computed(() => {
    const acteurs = this.acteurs();
    const seen = new Set<number>();
    const out: Nomenclature[] = [];
    for (const a of acteurs) {
      for (const c of a.categories || []) {
        if (c.id_nomenclature && !seen.has(c.id_nomenclature)) {
          seen.add(c.id_nomenclature);
          out.push(c);
        }
      }
    }
    this.nomenclatureService.sortByName(out);
    return out;
  });

  /** Profils distincts issus des acteurs (pour le filtre). */
  filterProfilsOptions = computed(() => {
    const acteurs = this.acteurs();
    const seen = new Set<number>();
    const out: Nomenclature[] = [];
    for (const a of acteurs) {
      const p = a.profil;
      if (p?.id_nomenclature && !seen.has(p.id_nomenclature)) {
        seen.add(p.id_nomenclature);
        out.push(p);
      }
    }
    this.nomenclatureService.sortByName(out);
    return out;
  });

  /** Statuts d'entretien distincts + option "À faire" (pour le filtre). */
  filterStatutsOptions = computed(() => {
    const acteurs = this.acteurs();
    const seen = new Set<number>();
    const out: Nomenclature[] = [{ id_nomenclature: 0, libelle: 'À faire', value: 0, mnemonique: '', ordre: 0 } as Nomenclature];
    for (const a of acteurs) {
      const s = a.statut_entretien;
      if (s?.id_nomenclature && s.libelle?.trim() && !seen.has(s.id_nomenclature)) {
        seen.add(s.id_nomenclature);
        out.push(s);
      }
    }
    const withStatuts = out.filter(o => o.id_nomenclature !== 0);
    this.nomenclatureService.sortByName(withStatuts);
    return [{ id_nomenclature: 0, libelle: 'À faire', value: 0, mnemonique: '', ordre: 0 } as Nomenclature, ...withStatuts];
  });

  /** Liste des acteurs filtrée (mode expansion panels). */
  filteredActeurs = computed(() => {
    const list = this.acteurs();
    const search = this._normalize(this.filterSearch());
    const catIds = this.filterCategoryIds();
    const profilIds = this.filterProfilIds();
    const statutIds = this.filterStatutEntretienIds();

    return list.filter(actor => {
      if (search) {
        const fullText = this._normalize([actor.nom, actor.prenom, actor.fonction, actor.structure].filter(Boolean).join(' '));
        if (!fullText.includes(search)) return false;
      }
      if (catIds.length > 0) {
        const actorCatIds = (actor.categories || []).map(c => c.id_nomenclature);
        if (!catIds.some(id => actorCatIds.includes(id))) return false;
      }
      if (profilIds.length > 0) {
        const pid = actor.profil?.id_nomenclature;
        if (pid === undefined || !profilIds.includes(pid)) return false;
      }
      if (statutIds.length > 0) {
        const sid = actor.statut_entretien?.id_nomenclature;
        const isAFaire = !actor.statut_entretien?.libelle?.trim();
        const matchAFaire = statutIds.includes(0) && isAFaire;
        const matchStatut = sid !== undefined && statutIds.includes(sid);
        if (!matchAFaire && !matchStatut) return false;
      }
      return true;
    });
  });

  private _normalize(text: string): string {
    return (text || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }

  setFilterCategoryIds(ids: number[]) { this.filterCategoryIds.set(ids); }
  setFilterProfilIds(ids: number[]) { this.filterProfilIds.set(ids); }
  setFilterStatutEntretienIds(ids: number[]) { this.filterStatutEntretienIds.set(ids); }
  resetListFilters() {
    this.filterSearch.set('');
    this.filterCategoryIds.set([]);
    this.filterProfilIds.set([]);
    this.filterStatutEntretienIds.set([]);
  }

  constructor(){
    effect(() => {
      this.previousPage = this.stateService.getCurrentPreviousPage()!;
      
      this.acteurs.set(this.actors());
      if (this.diagnostic().id_diagnostic > 0){
        this.diag.set(this.diagnostic());
      }else{
        this.diag.set(this.stateService.getCurrentDiagnostic()!);
      }
 
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

    effect(() => {
      this.filteredActorsChange.emit(this.filteredActeurs());
    });
  }

  compareActors = (a: Acteur, b: Acteur) => a?.id_acteur === b?.id_acteur;

  /** Libellé affiché pour l'état de l'entretien (header du panel). */
  getStatutEntretienLabel(actor: Acteur): string {
    const lib = actor.statut_entretien?.libelle;
    return (lib && lib.trim()) ? lib : 'À faire';
  }

  /** Libellés des catégories de l'acteur (pour l'affichage dans le panel). */
  getCategoriesLabel(actor: Acteur): string {
    const cats = actor.categories || [];
    return cats.map(c => c.libelle).join(', ') || '—';
  }

  /** Classe CSS pour le badge d'état (couleur selon statut). */
  getStatutEntretienClass(actor: Acteur): string {
    const lib = actor.statut_entretien?.libelle;
    switch (lib) {
      case 'Réalisé': return 'statut-realized';
      case 'Reporté':
      case 'En cours':
      case 'Programmé': return 'statut-pending';
      case 'Annulé':
      case 'Rétracté': return 'statut-canceled';
      default: return 'statut-todo';
    }
  }

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

  openAlertDisable(acteur:Acteur){
      const dialogRef = this.dialog.open(AlerteSuppressionActeurComponent, {
        data: {
          title: "Supprimer l'acteur'",
          acteur:acteur,
          message: "Vous êtes sur le point de supprimer cet acteur. Etes-vous sûr-e de vouloir continuer ?"
          
        }
      });

      dialogRef.afterClosed().subscribe(acteur => {
        if (acteur) {
          this.delete.emit(acteur);
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
    this.stateService.setPageFromActor("oui");
    this.stateService.setActor(acteur!);
    this.stateService.setPageDiagnostic(this.router.url);
    this.siteService.navigateAndCache(path,diagnostic);
  }
  
  //Enregistre les acteurs
  recordActors(){
    const selectedActors = this.acteurs().filter(a => a.selected);
    if (selectedActors.length > 0) {
      const newDiag = this.diag();
      newDiag.acteurs = selectedActors;
      const diagToSend = Diagnostic.fromJson(newDiag);
      this.diagnosticService.update(diagToSend).subscribe(updated => {
        this.setActors(updated);
        this.getConfirmation("Le diagnostic contient désormais ces informations :", updated, this.no_creation());
      });
    }
    
  }

  getConfirmation(message:string,diag:Diagnostic,no_creation?:boolean){
        this.previousPage = this.stateService.getCurrentPreviousPage();
     
        if (!no_creation){
          this.stateService.setPageFromActor("oui");
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
    this.siteSub?.unsubscribe();
  }
}
