import { CommonModule } from '@angular/common';
import { Component, Inject, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { Acteur } from '@app/models/acteur.model';
import { ActeurService } from '@app/services/acteur.service';
import { Labels } from '@app/utils/labels';

@Component({
  selector: 'app-alerte-suppression-acteur',
  imports: [MatDialogModule,CommonModule,MatButtonModule],
  templateUrl: './alerte-suppression-acteur.component.html',
  styleUrl: './alerte-suppression-acteur.component.css'
})
export class AlerteSuppressionActeurComponent {
  constructor(
    public dialogRef: MatDialogRef<AlerteSuppressionActeurComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { acteur: Acteur }
  ) {}

  actorService = inject(ActeurService);
  labels = new Labels();

  get confirmationMessage(): string {
    const { prenom, nom, structure } = this.data.acteur;
    const organisme = structure?.trim() || '—';
    return (
      `Vous êtes sur le point de supprimer l'acteur ${prenom} ${nom} (${organisme}) ` +
      `et l'ensemble de ses données associées (réponses, AFOM...). Cette opération est irréversible. Voulez-vous confirmer ?`
    );
  }

  get deleteButtonLabel(): string {
    const { prenom, nom } = this.data.acteur;
    return `Supprimer ${prenom} ${nom}`;
  }

  deleteActor(): void {
    const acteur = this.data.acteur;
    this.actorService.deleteActor(acteur).subscribe(() => {
      this.dialogRef.close(acteur);
    });
  }


  close(){
    this.dialogRef.close();
  }
}
