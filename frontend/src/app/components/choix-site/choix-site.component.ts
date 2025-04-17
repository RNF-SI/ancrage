import { Component, inject } from '@angular/core';
import { MapComponent } from '../map/map.component';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FormsModule } from '@angular/forms';
import { Site } from '@app/models/site.model';
import { SiteService } from '@app/services/sites.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-choix-site',
  templateUrl: './choix-site.component.html',
  styleUrls: ['./choix-site.component.css'],
  standalone:true,
  imports:[MapComponent,CommonModule,MatTableModule,MatCheckboxModule,FormsModule]
})
export class ChoixSiteComponent {
 
  displayedColumns: string[] = ['nom', 'departements','regions', 'type','habitats'];

  sites:Site[]=[];
    
  private siteService = inject(SiteService);
  private sitesSub!: Subscription;
  title="Choisir les sites";
  titleChosenSites="Sites choisis";

  ngOnInit(): void {
    
    this.sitesSub = this.siteService.getAll().subscribe(sites => {
      console.log(sites);
      return this.sites = sites;
    });;
  }

  ngOnDestroy(): void {
    this.sitesSub?.unsubscribe();
  }

}
