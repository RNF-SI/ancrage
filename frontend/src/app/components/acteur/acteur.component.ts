import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '@app/home-rnf/services/auth-service.service';
import { Acteur } from '@app/models/acteur.model';
import { Commune } from '@app/models/commune.model';
import { Nomenclature } from '@app/models/nomenclature.model';
import { ActeurService } from '@app/services/acteur.service';
import { CommuneService } from '@app/services/commune.service';
import { NomenclatureService } from '@app/services/nomenclature.service';
import { Labels } from '@app/utils/labels';
import { debounceTime, forkJoin,  Subscription } from 'rxjs';
import { AlerteActeurComponent } from '../alertes/alerte-acteur/alerte-acteur.component';
import { Diagnostic } from '@app/models/diagnostic.model';
import { SiteService } from '@app/services/sites.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DiagnosticStoreService } from '@app/services/diagnostic-store.service';

@Component({
  selector: 'app-acteur',
  templateUrl: './acteur.component.html',
  styleUrls: ['./acteur.component.css'],
  standalone:true,
  imports:[CommonModule,MatFormFieldModule,ReactiveFormsModule,MatSelectModule,FormsModule,MatInputModule,MatAutocompleteModule,MatButtonModule,MatProgressSpinnerModule]
})
export class ActeurComponent implements OnInit,OnDestroy{
  
  fb = inject(FormBuilder);
  uniqueProfiles:Nomenclature[] = [];
  uniqueTowns:Commune[] = [];
  uniqueCategories:Nomenclature[]=[];
  actor = new Acteur();
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
        profil: this.fb.control<Nomenclature | null>(null, [Validators.required]),
        categories: this.fb.control<Nomenclature[] | null>(null, [Validators.required]),
        is_acteur_economique: [false],
        is_acteur_economique_txt: ['', [Validators.required]],
        structure: ['', [Validators.required]],
        modified_by: [0]
  });
  private routeSubscription?:Subscription;
  private route = inject(ActivatedRoute);
  id_actor = 0;
  private communeService = inject(CommuneService);
  private nomenclatureService = inject(NomenclatureService);
  private authService = inject(AuthService);
  private communeSubscription?:Subscription;
  private actorSubscription?:Subscription;
  private actorService = inject(ActeurService);
  private dialog = inject(MatDialog);
  private siteService = inject(SiteService);
  private diagnosticStoreService = inject(DiagnosticStoreService);
  private diagnosticStoreSubscription?:Subscription;
  user_id=0;
  filteredTowns: Commune[] = [];
  labels = new Labels();
  title = "";
  diagnostic:Diagnostic = new Diagnostic();
  previousPage = "";
  isLoading=false;
  

  ngOnInit(): void {
    this.diagnosticStoreSubscription = this.diagnosticStoreService.getDiagnostic().subscribe(diag =>{
      this.diagnostic = diag!;
      console.log(this.diagnostic);
    });
    this.isLoading = true;
    this.routeSubscription = this.route.params.subscribe((params: any) => {
          this.id_actor = params['id_acteur'];  
          const communes$ = this.communeService.getAll();
          const profils$ = this.nomenclatureService.getAllByType("profil");
          const categories$ = this.nomenclatureService.getAllByType("categorie");
          this.user_id = this.authService.getCurrentUser().id_role;
          if (this.id_actor) {
            this.title = this.labels.modifyActor;
            const actor$ = this.actorService.get(this.id_actor);

            forkJoin([actor$, communes$, profils$,categories$]).subscribe(([actor,communes, profils,categories]) => {
              console.log(actor);
              if (this.formGroup.get('is_acteur_economique')?.value == true){
                this.formGroup.get('is_acteur_economique_txt')!.setValue('oui');
              }else if (this.formGroup.get('is_acteur_economique')?.value == false){
                this.formGroup.get('is_acteur_economique_txt')!.setValue('non');
              }
              this.actor = actor;
              
              
              this.instructionsWithResults(communes,profils,categories);
              this.actor.categories = (this.actor.categories|| []).map(cat =>
                this.uniqueCategories.find(uc => uc.id_nomenclature === cat.id_nomenclature) || cat
              );
              this.actor.profil = this.uniqueProfiles.find(pfl => pfl.id_nomenclature === this.actor.profil?.id_nomenclature) || this.actor.profil;
              
              this.formGroup.patchValue({
                id_acteur: this.actor.id_acteur,
                nom: this.actor.nom,
                prenom: this.actor.prenom,
                created_by: this.actor.created_by,
                fonction: this.actor.fonction,
                telephone: this.actor.telephone,
                mail: this.actor.mail,
                commune: this.actor.commune,
                profil: this.actor.profil?.id_nomenclature! > 0 ? this.actor.profil : null,
                categories: this.actor.categories,
                is_acteur_economique: this.actor.is_acteur_economique,
                structure: this.actor.structure
              });
              this.isLoading = false; 
            });
          } else {
            
            this.title = this.labels.createActor;
            forkJoin([communes$, profils$,categories$]).subscribe(([communes, profils,categories]) => {
              
              this.instructionsWithResults(communes,profils,categories);
              this.isLoading = false; 
            });
          }
        });
  }

  instructionsWithResults(communes:Commune[],profils:Nomenclature[],categories:Nomenclature[]){
    this.uniqueProfiles = profils;
    this.uniqueTowns = communes;
    this.uniqueCategories = categories;
    this.communeSubscription = this.formGroup.get('commune')!.valueChanges
    .pipe(debounceTime(200))
    .subscribe((value: string | Commune | null) => {
      const filterValue = typeof value === 'string' ? value : value?.nom_com || '';
      this.filteredTowns = this._filter(filterValue);
    });
  }

  private _filter(filterValue: string): Commune[] {
    const lower = filterValue.toLowerCase();
    return this.uniqueTowns
      .filter(t => t.nom_com.toLowerCase().includes(lower))
      .slice(0, 30); // optionnel : limiter le nombre affiché
  }

  displayFn(commune: Commune): string {
    return commune?.nom_com || '';
  }

  recordActor(event: Event) {
    event.preventDefault();
    console.log(this.formGroup.get('profil')?.value);
    if (this.formGroup.get('is_acteur_economique_txt')?.value == 'oui'){
      this.formGroup.get('is_acteur_economique')!.setValue(true);
    }else if (this.formGroup.get('is_acteur_economique_txt')?.value == 'non'){
      this.formGroup.get('is_acteur_economique')!.setValue(false);
    }
    if (this.id_actor == undefined){
      this.formGroup.get('created_by')!.setValue(this.user_id);
      if (!this.formGroup.invalid){
        this.actor = Object.assign(new Acteur(),this.formGroup.value);
        this.actorSubscription = this.actorService.add(this.actor).subscribe(
          actor =>{
            this.getConfirmation("L'acteur suivant a été créé dans la base de données et a été ajouté au diagnostic : ",actor);
          }
        )
      }
      
    }else{
      this.formGroup.get('modified_by')!.setValue(this.user_id);
      this.actor = Object.assign(new Acteur(),this.formGroup.value);
      if (!this.formGroup.invalid){
        this.actorSubscription = this.actorService.update(this.actor).subscribe(
          actor =>{
            this.getConfirmation("L'acteur suivant a été modifié dans la base de données et a été ajouté au diagnostic : ",actor);
          }
        )
      }
    }
    
  }
  
  getConfirmation(message:string,actor:Acteur){
    this.previousPage = localStorage.getItem("previousPage")!;
    this.diagnostic.acteurs.push(actor);
    this.diagnosticStoreService.setDiagnostic(this.diagnostic);
    console.log(actor);
    if(actor.id_acteur > 0){
      console.log(actor);
      this.dialog.open(AlerteActeurComponent, {
        data: {
          title: this.title,
          message: message,
          acteur: actor,
          labels: this.labels,
          diagnostic:this.diagnostic,
          previousPage:this.previousPage
        }
      });
    }
    
  }

  navigate(path:string,diagnostic:Diagnostic){
    
    this.siteService.navigateAndReload(path,diagnostic);
  }

  ngOnDestroy(): void {
    this.routeSubscription?.unsubscribe();
    this.communeSubscription?.unsubscribe();
    this.actorSubscription?.unsubscribe();
  }
}
