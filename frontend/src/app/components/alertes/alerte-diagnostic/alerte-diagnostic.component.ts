import { CommonModule } from '@angular/common';
import { Component, Inject, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { Router, RouterModule } from '@angular/router';
import { Acteur } from '@app/models/acteur.model';
import { Diagnostic } from '@app/models/diagnostic.model';
import { SiteService } from '@app/services/sites.service';
import { Labels } from '@app/utils/labels';

@Component({
  selector: 'app-alerte-diagnostic',
  templateUrl: './alerte-diagnostic.component.html',
  styleUrls: ['./alerte-diagnostic.component.css'],
  standalone:true,
  imports:[MatDialogModule,MatButtonModule,CommonModule,RouterModule]
})
export class AlerteDiagnosticComponent {
  constructor(
        public dialogRef: MatDialogRef<AlerteDiagnosticComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { 
          title: string; 
          message: string; 
          labels :Labels,
          diagnostic:Diagnostic,
          previousPage:string;
        }
      ) {}
      
      private siteService = inject(SiteService);
    
    
      navigate(path:string,diagnostic:Diagnostic){
        
        this.dialogRef.close();
        this.siteService.navigateAndReload(path,diagnostic);
      }
      close(){
        this.dialogRef.close();
      }
}
