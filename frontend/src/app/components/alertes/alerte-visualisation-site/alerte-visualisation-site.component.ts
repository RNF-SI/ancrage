import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Site } from '@app/models/site.model';
import { SiteLsComponent } from '@app/components/site-ls/site-ls.component';
import { Labels } from '@app/utils/labels';

//Affiche les détails d'un site
@Component({
    selector: 'app-alerte-visualisation-site',
    templateUrl: './alerte-visualisation-site.component.html',
    styleUrls: ['./alerte-visualisation-site.component.css'],
    imports: [SiteLsComponent]
})
export class AlerteVisualisationSiteComponent {

   constructor(
      public dialogRef: MatDialogRef<AlerteVisualisationSiteComponent>,
      @Inject(MAT_DIALOG_DATA) public data: { 
        site:Site, 
        labels:Labels,
        can_edit:boolean;
        
      }
    ) {}
   
}
