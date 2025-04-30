import { Component, inject, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { Site } from '@app/models/site.model';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { SiteService } from '@app/services/sites.service';
import { Diagnostic } from '@app/models/diagnostic.model';
@Component({
  selector: 'app-alerte-site',
  templateUrl: './alerte-site.component.html',
  styleUrls: ['./alerte-site.component.css'],
  standalone:true,
  imports:[MatDialogModule,MatButtonModule,CommonModule,RouterModule]
})
export class AlerteSiteComponent {
 
  constructor(
    public dialogRef: MatDialogRef<AlerteSiteComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { 
      title: string; 
      message: string; 
      site:Site, 
      labels : {
        departementLabel: "",
        housingLabel: "",
        statusLabel:"",
        nameLabel: "",
        latitudeLabel: "",
        longitudeLabel: "",
        btnRecordLabel: "",
        btnPreviousStepLabel: ""
      },
      diagnostic:Diagnostic,
      previousPage:string;
    }
  ) {}
  
  private siteService = inject(SiteService);


  navigate(path:string,diagnostic:Diagnostic){
    console.log(path);
    console.log(this.data.previousPage);
    this.siteService.navigateAndReload(path,diagnostic)
  }
  
} 