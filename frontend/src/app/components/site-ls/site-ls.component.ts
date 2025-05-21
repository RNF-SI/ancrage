import { CommonModule } from '@angular/common';
import { Component, inject, Input, OnDestroy, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialogRef } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { Diagnostic } from '@app/models/diagnostic.model';
import { Site } from '@app/models/site.model';
import { SiteService } from '@app/services/sites.service';
import { Labels } from '@app/utils/labels';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-site-ls',
  templateUrl: './site-ls.component.html',
  styleUrls: ['./site-ls.component.css'],
  standalone:true,
  imports:[MatCardModule,CommonModule,MatButtonModule]
})
export class SiteLsComponent implements OnInit, OnDestroy{
  
  private siteService = inject(SiteService);
  private route = inject(ActivatedRoute);
  private routeSubscription?:Subscription;

  @Input() labels = new Labels();
  @Input() site:Site = new Site();
  @Input() dialogRef = inject(MatDialogRef)
  diagnostic:Diagnostic = new Diagnostic();
  siteSubscription?:Subscription;
  @Input() can_edit:boolean = false;
  
  ngOnInit(): void {
    
    this.routeSubscription = this.route.params.subscribe((params: any) => {
      const id_site = params['id_site'];
    
      if (id_site) {
        this.siteSubscription = this.siteService.get(id_site).subscribe(site => {
          this.site = site;
        });
      } else if (this.site?.id_site) { 
        this.siteSubscription = this.siteService.get(this.site.id_site).subscribe(site => {
          this.site = site;
        });
      }
    });
    
  }

  navigate(path:string,diagnostic:Diagnostic){
    this.siteService.navigateAndReload(path,diagnostic);
    this.dialogRef.close();
  }
  ngOnDestroy(): void {
    this.routeSubscription?.unsubscribe();
    this.siteSubscription?.unsubscribe();
  }

  cancel(){
    this.dialogRef.close();
  }
}
