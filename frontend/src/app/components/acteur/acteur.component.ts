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
import { ReferenceDataService } from '@app/services/reference-data.service';
import { AlerteActeurComponent } from '../alertes/alerte-acteur/alerte-acteur.component';
import { Diagnostic } from '@app/models/diagnostic.model';
import { SiteService } from '@app/services/sites.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

//Composant pour crééer ou modifier un acteur
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
        structure: ['', [Validators.required]],
        modified_by: [0],
        slug: ['']
  });
  private routeSubscription?:Subscription;
  private route = inject(ActivatedRoute);
  id_actor = 0;
  slug="";
  private communeService = inject(CommuneService);
  private nomenclatureService = inject(NomenclatureService);
  private referenceDataService = inject(ReferenceDataService);
  private authService = inject(AuthService);
  private communeSubscription?:Subscription;
  private actorSubscription?:Subscription;
  private actorService = inject(ActeurService);
  private dialog = inject(MatDialog);
  private siteService = inject(SiteService);
  user_id=0;
  filteredTowns: Commune[] = [];
  labels = new Labels();
  title = "";
  diagnostic:Diagnostic = new Diagnostic();
  previousPage = "";
  isLoading=false;
  pageDiagnostic = "";

  ngOnInit(): void {
    
    this.diagnostic = JSON.parse(localStorage.getItem("diagnostic")!);
    this.isLoading = true;
    this.routeSubscription = this.route.params.subscribe((params: any) => {
          this.id_actor = params['id_acteur'];  
          this.slug = params['slug'];
          this.user_id = this.authService.getCurrentUser().id_role;
          
          /* Modification */
          if (this.id_actor && this.slug) {
            this.title = this.labels.modifyActor;
            const actor$ = this.actorService.get(this.id_actor,this.slug);
            const referenceData$ = this.referenceDataService.getActorFormData();

            forkJoin([actor$, referenceData$]).subscribe(([actor, refData]) => {
              this.actor = actor;
              this.instructionsWithResults(refData.communes, refData.profils, refData.categories);
              
              // Remappage des données avec les références chargées
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
                structure: this.actor.structure,
                slug: this.actor.slug
              });
              this.isLoading = false; 
            });
          } else {
            /* Création */
            this.title = this.labels.createActor;
            this.referenceDataService.getActorFormData().subscribe((refData) => {
              this.instructionsWithResults(refData.communes, refData.profils, refData.categories);
              this.isLoading = false; 
            });
          }
        });
  }
  //Réception des données
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
    if (this.id_actor == undefined){
      this.formGroup.get('created_by')!.setValue(this.user_id);
      if (!this.formGroup.invalid){
        this.actor = Object.assign(new Acteur(),this.formGroup.value);
        this.actor.diagnostic = new Diagnostic();
        this.actor.diagnostic.id_diagnostic = this.diagnostic.id_diagnostic;
        this.actorSubscription = this.actorService.add(this.actor).subscribe(
          actor =>{
            this.getConfirmation("L'acteur suivant a été créé dans la base de données et a été ajouté au diagnostic : ",actor);
          }
        )
      }
      
    }else{
      //Modification
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
  //Alerte de confirmation
  getConfirmation(message:string,actor:Acteur){
    this.pageDiagnostic = localStorage.getItem("pageDiagnostic")!;
    this.previousPage = localStorage.getItem("previousPage")!;
    this.diagnostic.acteurs.push(actor);
    
    if(actor.id_acteur > 0){
      
      this.dialog.open(AlerteActeurComponent, {
        data: {
          title: this.title,
          message: message,
          acteur: actor,
          labels: this.labels,
          diagnostic:this.diagnostic,
          previousPage:this.pageDiagnostic
        }
      });
    }
    
  }
  //Navigation et mise en cache du diagnostic
  navigate(path:string,diagnostic:Diagnostic){
    
    this.siteService.navigateAndCache(path,diagnostic);
  }

  ngOnDestroy(): void {
    this.routeSubscription?.unsubscribe();
    this.communeSubscription?.unsubscribe();
    this.actorSubscription?.unsubscribe();
  }
}
