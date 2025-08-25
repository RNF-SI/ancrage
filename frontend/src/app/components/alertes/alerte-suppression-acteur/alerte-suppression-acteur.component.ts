import { CommonModule } from '@angular/common';
import { Component, Inject, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Acteur } from '@app/models/acteur.model';
import { Diagnostic } from '@app/models/diagnostic.model';
import { ActeurService } from '@app/services/acteur.service';
import { DiagnosticService } from '@app/services/diagnostic.service';
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
    @Inject(MAT_DIALOG_DATA) public data: { 
      title: string; 
      message: string; 
      acteur:Acteur;
   
    }
  ) {}

  actorService = inject(ActeurService);
  router = inject(Router);
  labels  = new Labels();

  disable(){
    this.actorService.disableActor(this.data.acteur).subscribe(acteur =>{
      const path = '/diagnostic-visualisation/'+acteur.diagnostic?.id_diagnostic+'/'+acteur.diagnostic?.slug;
      console.log(path);
      this.router.navigate([path]);
      this.dialogRef.close(acteur);
    })
  }


  close(){
    this.dialogRef.close();
  }
}
