import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, OnDestroy, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { AuthService } from '@app/home-rnf/services/auth-service.service';
import { Acteur } from '@app/models/acteur.model';
import { Commune } from '@app/models/commune.model';
import { Nomenclature } from '@app/models/nomenclature.model';
import { ActeurService } from '@app/services/acteur.service';
import { CommuneService } from '@app/services/commune.service';
import { NomenclatureService } from '@app/services/nomenclature.service';
import { Labels } from '@app/utils/labels';
import { forkJoin,  Subscription } from 'rxjs';
import { AlerteActeurComponent } from '../alertes/alerte-acteur/alerte-acteur.component';
import { Diagnostic } from '@app/models/diagnostic.model';
import { SiteService } from '@app/services/sites.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { toSignal } from '@angular/core/rxjs-interop';
import { LoadingSpinnerComponent } from '@app/home-rnf/components/loading-spinner/loading-spinner.component';

//Composant pour crééer ou modifier un acteur
@Component({
    selector: 'app-acteur',
    templateUrl: './acteur.component.html',
    styleUrls: ['./acteur.component.css'],
    imports: [CommonModule, MatFormFieldModule, ReactiveFormsModule, MatSelectModule, FormsModule, MatInputModule, MatAutocompleteModule, MatButtonModule, MatProgressSpinnerModule,LoadingSpinnerComponent]
})
export class ActeurComponent implements OnDestroy{
  
  fb = inject(FormBuilder);
  uniqueProfiles:Nomenclature[] = [];
  uniqueTowns:Commune[] = [];
  uniqueCategories:Nomenclature[]=[];
  actor = signal<Acteur>(new Acteur());
  options = ['oui','non'];
  formGroup = this.fb.group({
        id_acteur: [0, [Validators.required]],
        nom: ['', [Validators.required]],
        prenom: ['', [Validators.required]],
        created_by: [0, [Validators.required]],
        fonction: ['', [Validators.required]],
        telephone: ["",[Validators.pattern(/^0[1-9](?: \d{2}){4}$/)]],
        mail: ['',[Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)]],
        commune: this.fb.control<Commune | null>(null, [Validators.required]),
        profil: this.fb.control<Nomenclature | null>(null),
        categories: this.fb.control<Nomenclature[] | null>(null, [Validators.required]),
        structure: ['', [Validators.required]],
        modified_by: [0],
        slug: ['']
  });
  id_actor = signal<number>(0);
  slug=signal<string>("");
  private communeService = inject(CommuneService);
  private nomenclatureService = inject(NomenclatureService);
  private authService = inject(AuthService);
  private actorSubscription?:Subscription;
  private actorService = inject(ActeurService);
  private dialog = inject(MatDialog);
  private siteService = inject(SiteService);
  user_id=0;
  filteredTowns: Commune[] = [];
  labels = new Labels();
  title = "";
  diagnostic = signal<Diagnostic>(JSON.parse(localStorage.getItem("diagnostic")!));
  previousPage = "";
  isLoading=true;
  pageDiagnostic = "";
  routeParams = toSignal(inject(ActivatedRoute).params, { initialValue: {} });
  readonly communeControl = this.formGroup.get('commune')!;
  readonly communeValue = toSignal(this.communeControl.valueChanges, { initialValue: this.communeControl.value });
  readonly nom = computed(() => this.formGroup.get('nom')?.value ?? '');
  readonly prenom = computed(() => this.formGroup.get('prenom')?.value ?? '');
  readonly fonction = computed(() => this.formGroup.get('fonction')?.value ?? '');
  readonly structure = computed(() => this.formGroup.get('structure')?.value ?? '');

  constructor() {
    effect(() => {
      this.pageDiagnostic = localStorage.getItem("pageDiagnostic")!;
      const { id_acteur, slug } = this.routeParams() as Params;
      const id = Number(id_acteur);
      const slugValue = slug as string;
      const communes$ = this.communeService.getAll();
      const profils$ = this.nomenclatureService.getAllByType("profil");
      const categories$ = this.nomenclatureService.getAllByType("categorie");

      if (id && slugValue) {
        this.title = this.labels.modifyActor;
        this.id_actor.set(id);
        this.slug.set(slugValue);
        this.user_id = this.authService.getCurrentUser().id_role;
        const actor$ = this.actorService.get(this.id_actor(),this.slug());
        forkJoin([actor$, communes$, profils$,categories$]).subscribe(([actor,communes, profils,categories]) => {
          this.actor.set(actor);
          this.instructionsWithResults(communes,profils,categories);
          this.actor().categories = (this.actor().categories|| []).map(cat =>
            this.uniqueCategories.find(uc => uc.id_nomenclature === cat.id_nomenclature) || cat
          );
          this.actor().profil = this.uniqueProfiles.find(pfl => pfl.id_nomenclature === this.actor().profil?.id_nomenclature) || this.actor().profil;
          
          this.patchValue();
          this.isLoading = false; 
        });
      }else{
        this.title = this.labels.createActor;
            forkJoin([communes$, profils$,categories$]).subscribe(([communes, profils,categories]) => {
              
              this.instructionsWithResults(communes,profils,categories);
              this.isLoading = false; 
            });
      }
    });

    effect(() => {
      const value = this.communeValue();
      const filterValue = typeof value === 'string' ? value : value?.nom_com || '';
      this.filteredTowns = this._filter(filterValue);
    });
  }

  
  patchValue() {
    this.formGroup.patchValue({
      ...this.actor(),
      profil: this.actor().profil?.id_nomenclature ? this.actor().profil : null,
      categories: this.actor().categories ?? [],
    });
  }
 
  //Réception des données
  instructionsWithResults(communes:Commune[],profils:Nomenclature[],categories:Nomenclature[]){
    this.uniqueProfiles = profils;
    this.uniqueTowns = communes;
    this.uniqueCategories = categories;
    
  }
  //Filtre sur communes
  private _filter(filterValue: string): Commune[] {
    const lower = filterValue.toLowerCase();
    return this.uniqueTowns
      .filter(t => t.nom_com.toLowerCase().includes(lower))
      .slice(0, 30); // optionnel : limiter le nombre affiché
  }

  //Autocomplétion
  displayFn(commune: Commune): string {
    return commune?.nom_com || '';
  }

  //Enregistrement du formulaire
  recordActor(event: Event) {
    event.preventDefault();
    //Ajout
    if (this.id_actor() === 0){
      this.formGroup.get('created_by')!.setValue(this.user_id);
      if (!this.formGroup.invalid){
        this.actor.set(Object.assign(new Acteur(),this.formGroup.value));
        const actorToSend = this.actor();
        actorToSend.diagnostic = new Diagnostic();
        
        actorToSend.diagnostic.id_diagnostic = this.diagnostic().id_diagnostic;
        this.actorSubscription = this.actorService.add(actorToSend).subscribe(
          actor =>{
            this.getConfirmation("L'acteur suivant a été créé dans la base de données et a été ajouté au diagnostic : ",actor);
            
          }
        )
      }
      
    }else{
      //Modification
      this.formGroup.get('modified_by')!.setValue(this.user_id);
      this.actor.set(Object.assign(new Acteur(),this.formGroup.value));
     
      if (!this.formGroup.invalid){
        this.actorSubscription = this.actorService.update(this.actor()).subscribe(
          actor =>{
            this.getConfirmation("L'acteur suivant a été modifié dans la base de données et a été ajouté au diagnostic : ",actor);
            for (let act of this.diagnostic().acteurs){
              if (actor.id_acteur === act.id_acteur){
                act = actor;
              }
            }
          }
        )
      }
    }
    
  }
  //Alerte de confirmation
  getConfirmation(message:string,actor:Acteur){
    
    this.previousPage = localStorage.getItem("previousPage")!;
    this.diagnostic().acteurs.push(actor);
    
    if(actor.id_acteur > 0){
      
      const dialogRef = this.dialog.open(AlerteActeurComponent, {
        data: {
          title: this.title,
          message: message,
          acteur: actor,
          labels: this.labels,
          diagnostic:this.diagnostic(),
          previousPage:this.pageDiagnostic
        }
      });

      dialogRef.afterClosed().subscribe(actor => {
        if (actor) {
    
          this.actor.set(new Acteur());
          this.patchValue();
        }
      });
    }
    
  }
  //Navigation et mise en cache du diagnostic
  navigate(path:string,diagnostic:Diagnostic){

    localStorage.setItem("fromActor","oui");
    this.siteService.navigateAndCache(path,diagnostic);
  }

  ngOnDestroy(): void {
   
    this.actorSubscription?.unsubscribe();
  }
}
