import { CommonModule } from '@angular/common';
import { Component, Inject, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Acteur } from '@app/models/acteur.model';
import { Diagnostic } from '@app/models/diagnostic.model';
import { Site } from '@app/models/site.model';
import { SiteService } from '@app/services/sites.service';
import { Labels } from '@app/utils/labels';

@Component({
  selector: 'app-alerte-entretien',
  templateUrl: './alerte-entretien.component.html',
  styleUrls: ['./alerte-entretien.component.css'],
  standalone:true,
  imports:[CommonModule,MatDialogModule,MatButtonModule]
})
export class AlerteEntretienComponent {
  constructor(
      public dialogRef: MatDialogRef<AlerteEntretienComponent>,
      @Inject(MAT_DIALOG_DATA) public data: { 
        title: string; 
        message: string; 
        actor:Acteur, 
        labels :Labels,
        diagnostic:Diagnostic,
        previousPage:string;
      }
    ) {}
    
    private siteService = inject(SiteService);
  
    navigate(path:string,diagnostic:Diagnostic){
      
      this.siteService.navigateAndReload(path,diagnostic)
    }
  
    close(){
      this.dialogRef.close();
    }
}
