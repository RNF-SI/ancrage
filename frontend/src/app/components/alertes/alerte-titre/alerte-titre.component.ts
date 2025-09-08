import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Labels } from '@app/utils/labels';

@Component({
  selector: 'app-alerte-titre',
  imports: [
    MatDialogModule, 
    MatButtonModule, 
    MatFormFieldModule, 
    MatInputModule, 
    FormsModule,
    CommonModule
  ],
  templateUrl: './alerte-titre.component.html',
  styleUrl: './alerte-titre.component.css'
})
export class AlerteTitreComponent {
  labels = new Labels();
  title="";
  constructor(
    public dialogRef: MatDialogRef<AlerteTitreComponent>,
    
  ) {}

  close(){
    this.dialogRef.close(this.title);
  }

}
