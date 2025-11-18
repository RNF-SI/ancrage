import { Component, Inject, inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { Diagnostic } from '@app/models/diagnostic.model';
import { DiagnosticService } from '@app/services/diagnostic.service';
import { Router } from '@angular/router';
import { Labels } from '@app/utils/labels';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';

//Alerte de confirmation de suppression d'un diag
@Component({
  selector: 'app-alerte-desactivation-diag',
  imports: [MatDialogModule,CommonModule,MatButtonModule],
  templateUrl: './alerte-desactivation-diag.component.html',
  styleUrl: './alerte-desactivation-diag.component.css'
})
export class AlerteDesactivationDiagComponent {
  constructor(
    public dialogRef: MatDialogRef<AlerteDesactivationDiagComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { 
      title: string; 
      message: string; 
      diagnostic:Diagnostic;
   
    }
  ) {}

  diagService = inject(DiagnosticService);
  router = inject(Router);
  labels  = new Labels();

  disable(){
    this.diagService.disableDiag(this.data.diagnostic).subscribe(ok =>{
      this.router.navigate(['/diagnostics-liste']);
      this.dialogRef.close();
    });
  }


  close(){
    this.dialogRef.close();
  }
}
