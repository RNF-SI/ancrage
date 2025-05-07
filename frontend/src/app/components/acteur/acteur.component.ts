import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '@app/home-rnf/services/auth-service.service';
import { Acteur } from '@app/models/acteur.model';
import { Commune } from '@app/models/commune.model';
import { Nomenclature } from '@app/models/nomenclature.model';
import { ActeurService } from '@app/services/acteur.service';
import { CommuneService } from '@app/services/commune.service';
import { NomenclatureService } from '@app/services/nomenclature.service';
import { Labels } from '@app/utils/labels';
import { debounceTime, forkJoin, map, Observable, startWith, Subscription, throwError } from 'rxjs';

@Component({
  selector: 'app-acteur',
  templateUrl: './acteur.component.html',
  styleUrls: ['./acteur.component.css'],
  standalone:true,
  imports:[CommonModule,MatFormFieldModule,ReactiveFormsModule,MatSelectModule,FormsModule,MatInputModule,MatAutocompleteModule,MatButtonModule]
})
export class ActeurComponent implements OnInit,OnDestroy{
  
  fb = inject(FormBuilder);
  uniqueProfiles:Nomenclature[] = [];
  uniqueTowns:Commune[] = [];
  actor = new Acteur();
  options = ['oui','non'];
  formGroup = this.fb.group({
        id_acteur: [0, [Validators.required]],
        nom: ['', [Validators.required]],
        prenom: ['', [Validators.required]],
        created_by: [0, [Validators.required]],
        fonction: ['', [Validators.required]],
        telephone: ["06 07 08 09 10" ],
        mail: [''],
        commune: [new Commune(), [Validators.required]],
        profil: [new Nomenclature(), [Validators.required]],
        is_acteur_economique: [false],
        is_acteur_economique_txt: ['', [Validators.required]],
        structure: ['', [Validators.required]],
        modified_by: ['', [Validators.required]]
  });
  private routeSubscription?:Subscription;
  private route = inject(ActivatedRoute);
  id_actor = 0;
  private communeService = inject(CommuneService);
  private profilService = inject(NomenclatureService);
  private authService = inject(AuthService);
  private communeSubscription?:Subscription;
  private actorSubscription?:Subscription;
  private actorService = inject(ActeurService);

  user_id=0;
  filteredTowns: Commune[] = [];
  labels = new Labels();
  title = "";

  ngOnInit(): void {
    this.title = this.labels.createActor;
    this.routeSubscription = this.route.params.subscribe((params: any) => {
          this.id_actor = params['id_actor'];  
      
          const communes$ = this.communeService.getAll();
          const profils$ = this.profilService.getAllByType("profil");
      
          if (this.id_actor) {
           
          } else {
            this.user_id = this.authService.getCurrentUser().id_role;
            
            forkJoin([communes$, profils$]).subscribe(([communes, profils]) => {
              console.log(communes);
              console.log(profils);
              this.instructionsWithResults(communes,profils);
              
            });
          }
        });
  }

  instructionsWithResults(communes:Commune[],profils:Nomenclature[]){
    this.uniqueProfiles = profils;
    this.uniqueTowns = communes;
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
    console.log(this.formGroup.get('is_acteur_economique_txt')?.value);
    if (this.formGroup.get('is_acteur_economique_txt')?.value == 'oui'){
      this.formGroup.get('is_acteur_economique')!.setValue(true);
    }else if (this.formGroup.get('is_acteur_economique_txt')?.value == 'non'){
      this.formGroup.get('is_acteur_economique')!.setValue(false);
    }
    this.user_id = this.authService.getCurrentUser().id_role;
    this.formGroup.get('created_by')!.setValue(this.user_id);
    this.actor = Object.assign(new Acteur(),this.formGroup.value);

    this.actorSubscription = this.actorService.add(this.actor).subscribe(
      actor =>{
        console.log(actor);
      }
    )
  }
  

  ngOnDestroy(): void {
    this.routeSubscription?.unsubscribe();
    this.communeSubscription?.unsubscribe();
    this.actorSubscription?.unsubscribe();
  }
}
