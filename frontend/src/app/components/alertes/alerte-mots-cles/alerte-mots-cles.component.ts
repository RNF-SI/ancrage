import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MotCle } from '@app/models/mot-cle.model';

@Component({
  selector: 'app-alerte-mots-cles',
  templateUrl: './alerte-mots-cles.component.html',
  styleUrls: ['./alerte-mots-cles.component.css'],
  standalone:true,
  imports:[CommonModule,MatDialogModule,MatButtonModule]
})
export class AlerteMotsClesComponent {
  constructor(
            public dialogRef: MatDialogRef<AlerteMotsClesComponent>,
            @Inject(MAT_DIALOG_DATA) public data: { 
              keyword:MotCle
            }
          ) {}
  
          close(){
            this.dialogRef.close();
          }
  
}
