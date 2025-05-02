import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { AlerteSiteComponent } from '../alerte-site/alerte-site.component';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';
import { Acteur } from '@app/models/acteur.model';

@Component({
  selector: 'app-alerte-show-actor-details',
  templateUrl: './alerte-show-actor-details.component.html',
  styleUrls: ['./alerte-show-actor-details.component.css'],
  standalone:true,
  imports:[MatDialogModule,MatButtonModule,CommonModule,RouterModule]
})
export class AlerteShowActorDetailsComponent {
  constructor(
      public dialogRef: MatDialogRef<AlerteSiteComponent>,
      @Inject(MAT_DIALOG_DATA) public data: { 
        title: string; 
        actor:Acteur, 
        labels:{
          diagnosticsList:"",
          identity:"",
          region:"",
          department:"",
          category:"",
          status:"",
          structure:"",
          profile:"",
          telephone:"",
          mail:"",
          town:"",
          state:""
        }
        
      }
    ) {}

  close(){
    this.dialogRef.close();
  }
}
