import { CommonModule } from '@angular/common';
import { Component, effect, inject, input, OnDestroy, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialogRef } from '@angular/material/dialog';
import { ActivatedRoute, Params } from '@angular/router';
import { Diagnostic } from '@app/models/diagnostic.model';
import { Site } from '@app/models/site.model';
import { SiteService } from '@app/services/sites.service';
import { Labels } from '@app/utils/labels';
import { Subscription } from 'rxjs';

//Affiche les détails d'un site
@Component({
    selector: 'app-site-ls',
    templateUrl: './site-ls.component.html',
    styleUrls: ['./site-ls.component.css'],
    imports: [MatCardModule, CommonModule, MatButtonModule]
})
export class SiteLsComponent implements OnDestroy{
  
  private siteService = inject(SiteService);
  private route = inject(ActivatedRoute);
  private dialogRef = inject(MatDialogRef<SiteLsComponent>);
  private routeParams = toSignal(this.route.params, { initialValue: {} });

  labels = new Labels();

  site = input<Site>(new Site()); 
  siteLocal = signal<Site>(new Site()); 

  diagnostic: Diagnostic = new Diagnostic();
  can_edit = input<boolean>(false);

  private siteSubscription?: Subscription;

  constructor() {
    effect(() => {
      const { id_site, slug } = this.routeParams() as Params;
      const id = Number(id_site);
      const slugValue = slug as string;

      if (id && slugValue) {
        this.siteSubscription?.unsubscribe();
        this.siteSubscription = this.siteService.get(id, slugValue).subscribe(site => {
          this.siteLocal.set(site); // ← on met à jour la version locale
        });
      } else if (this.site().id_site && this.site().slug) {
        this.siteSubscription?.unsubscribe();
        this.siteSubscription = this.siteService.get(this.site().id_site, this.site().slug).subscribe(site => {
          this.siteLocal.set(site);
        });
      }
    });
  }

  navigate(path:string,diagnostic:Diagnostic){
    this.siteService.navigateAndCache(path,diagnostic);
    this.dialogRef.close();
  }
  ngOnDestroy(): void {
  
    this.siteSubscription?.unsubscribe();
  }

  cancel(){
    this.dialogRef.close();
  }
}
