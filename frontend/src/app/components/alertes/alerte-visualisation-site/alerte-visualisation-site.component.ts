import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Site } from '@app/models/site.model';
import { AlerteSiteComponent } from '../alerte-site/alerte-site.component';
import { SiteLsComponent } from '@app/components/site-ls/site-ls.component';
import { Labels } from '@app/utils/labels';

@Component({
  selector: 'app-alerte-visualisation-site',
  templateUrl: './alerte-visualisation-site.component.html',
  styleUrls: ['./alerte-visualisation-site.component.css'],
  standalone:true,
  imports:[SiteLsComponent]
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
