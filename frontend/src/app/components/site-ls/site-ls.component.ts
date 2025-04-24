import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { ActivatedRoute } from '@angular/router';
import { Diagnostic } from '@app/models/diagnostic.model';
import { Site } from '@app/models/site.model';
import { SiteService } from '@app/services/sites.service';
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

  labels = {
    departementLabel: "",
    housingLabel: "",
    statusLabel:"",
    nameLabel: "",
    latitudeLabel: "",
    longitudeLabel: "",
    btnRecordLabel: "",
    btnPreviousStepLabel: ""
  }
  site:Site = new Site();
  diagnostic:Diagnostic = new Diagnostic();
  
  ngOnInit(): void {
    this.labels = this.siteService.labels;
    this.routeSubscription = this.route.params.subscribe((params: any) => {
          const id_site = params['id_site'];  
          if (id_site) {
            this.siteService.get(id_site).subscribe(site=>{
              this.site = site;
            })
          }
    });
  }

  navigate(path:string,diagnostic:Diagnostic){
    this.siteService.navigateAndReload(path,diagnostic);
  }
  ngOnDestroy(): void {
    this.routeSubscription?.unsubscribe();
  }
}
