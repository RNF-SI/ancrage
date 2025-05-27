import { Component, inject, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { Site } from '@app/models/site.model';
import { CommonModule } from '@angular/common';
import { SiteService } from '@app/services/sites.service';
import { Diagnostic } from '@app/models/diagnostic.model';
import { Labels } from '@app/utils/labels';

//Alerte à la création ou modification d'un site
@Component({
  selector: 'app-alerte-site',
  templateUrl: './alerte-site.component.html',
  styleUrls: ['./alerte-site.component.css'],
  standalone:true,
  imports:[MatDialogModule,MatButtonModule,CommonModule]
})
export class AlerteSiteComponent {
  
  constructor(
    public dialogRef: MatDialogRef<AlerteSiteComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { 
      title: string; 
      message: string; 
      site:Site, 
      labels :Labels,
      diagnostic:Diagnostic,
      previousPage:string;
    }
  ) {}
  
  private siteService = inject(SiteService);

  navigate(path:string,diagnostic:Diagnostic){
    this.dialogRef.close();
    console.log(diagnostic);
    this.siteService.navigateAndCache(path,diagnostic);
  }

  close(){
    this.dialogRef.close();
  }
  
} 