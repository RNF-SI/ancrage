import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { AlerteSiteComponent } from '../alerte-site/alerte-site.component';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { Acteur } from '@app/models/acteur.model';
import { Labels } from '@app/utils/labels';

@Component({
  selector: 'app-alerte-show-actor-details',
  templateUrl: './alerte-show-actor-details.component.html',
  styleUrls: ['./alerte-show-actor-details.component.css'],
  standalone:true,
  imports:[MatDialogModule,MatButtonModule,CommonModule]
})
export class AlerteShowActorDetailsComponent {
  constructor(
      public dialogRef: MatDialogRef<AlerteSiteComponent>,
      @Inject(MAT_DIALOG_DATA) public data: { 
        title: string; 
        actor:Acteur, 
        labels:Labels
        
      }
    ) {}

  close(){
    this.dialogRef.close();
  }
}
