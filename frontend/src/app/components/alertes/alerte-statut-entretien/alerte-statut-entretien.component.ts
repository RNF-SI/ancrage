import { CommonModule } from '@angular/common';
import { Component, effect, Inject, inject, OnDestroy, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { Acteur } from '@app/models/acteur.model';
import { Diagnostic } from '@app/models/diagnostic.model';
import { Nomenclature } from '@app/models/nomenclature.model';
import { ActeurService } from '@app/services/acteur.service';
import { NomenclatureService } from '@app/services/nomenclature.service';
import { Labels } from '@app/utils/labels';
import { Subscription } from 'rxjs';

//Alerte pour la modification d'un statut d'entretien
@Component({
    selector: 'app-alerte-statut-entretien',
    templateUrl: './alerte-statut-entretien.component.html',
    styleUrls: ['./alerte-statut-entretien.component.css'],
    imports: [CommonModule, MatDialogModule, MatButtonModule, MatFormFieldModule, ReactiveFormsModule, MatSelectModule]
})
export class AlerteStatutEntretienComponent implements OnDestroy{
  constructor(
      public dialogRef: MatDialogRef<AlerteStatutEntretienComponent>,
      @Inject(MAT_DIALOG_DATA) public data: { 
        title: string; 
        message: string; 
        actor:Acteur, 
        labels :Labels,
        diagnostic:Diagnostic,
        previousPage:string;
      }
    ) {
      effect(() => {
      const statuts = this.statuts$();
  
      const filtered = statuts.filter(
        s => s.libelle !== 'Réalisé' && s.libelle !== 'En cours'
      );
  
      this.uniqueStates.set(filtered);
  
      this.formGroup.get("statut_entretien")?.setValue(this.data.actor.statut_entretien!);
    });}
  
    uniqueStates = signal<Nomenclature[]>([]);
    private fb = inject(FormBuilder);
    formGroup = this.fb.group({
        id_acteur: [0, [Validators.required]],
        statut_entretien: this.fb.control<Nomenclature | null>(null, [Validators.required])
    });

    private acteurService = inject(ActeurService);
    private acteurSubscription?:Subscription;
    private statutsSubcription ?:Subscription;
    private statutsService = inject(NomenclatureService);
    statuts$ = toSignal(
      this.statutsService.getAllByType("statut_entretien"), 
      { initialValue: [] }
    );

    recordState(event:Event){
      event.preventDefault();
      this.formGroup.get("id_acteur")?.setValue(this.data.actor.id_acteur);
      this.data.actor.statut_entretien = this.formGroup.get("statut_entretien")?.value!;
     
      if (!this.formGroup.invalid && this.data.actor.statut_entretien.id_nomenclature > 0){
        const json = {
          modified_by:this.data.actor.created_by
        }
        
        this.acteurSubscription = this.acteurService.modifiyInterviewState(json,this.data.actor.id_acteur,this.formGroup.get("statut_entretien")?.value?.id_nomenclature!).subscribe(acteur =>{
          this.dialogRef.close(acteur);
        });
      }
    }
  
    close(){
      this.dialogRef.close();
      this.acteurSubscription?.unsubscribe();
    }

    compareFn = (a: Nomenclature, b: Nomenclature) => a?.id_nomenclature === b?.id_nomenclature;

    ngOnDestroy(): void {
      this.statutsSubcription?.unsubscribe();
      this.acteurSubscription?.unsubscribe();
    }
}
