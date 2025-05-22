import { CommonModule } from '@angular/common';
import { Component, Inject, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { Acteur } from '@app/models/acteur.model';
import { Diagnostic } from '@app/models/diagnostic.model';
import { SiteService } from '@app/services/sites.service';
import { Labels } from '@app/utils/labels';

@Component({
  selector: 'app-alerte-acteur',
  templateUrl: './alerte-acteur.component.html',
  styleUrls: ['./alerte-acteur.component.css'],
  standalone:true,
  imports:[MatDialogModule,MatButtonModule,CommonModule]
})
export class AlerteActeurComponent {
  constructor(
      public dialogRef: MatDialogRef<AlerteActeurComponent>,
      @Inject(MAT_DIALOG_DATA) public data: { 
        title: string; 
        message: string; 
        acteur:Acteur, 
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
