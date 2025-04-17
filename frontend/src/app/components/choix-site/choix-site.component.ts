import { Component, inject } from '@angular/core';
import { MapComponent } from '../map/map.component';
import { CommonModule } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { Site } from '@app/models/site.model';
import { SiteService } from '@app/services/sites.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-choix-site',
  templateUrl: './choix-site.component.html',
  styleUrls: ['./choix-site.component.css'],
  standalone:true,
  imports:[MapComponent,CommonModule,MatTableModule,MatCheckboxModule,FormsModule,MatSelectModule,MatFormFieldModule,MatButtonModule]
})

export class ChoixSiteComponent {
 
  displayedColumns: string[] = ['nom', 'departements','regions', 'type','habitats'];
  sitesOriginal: Site[] = []; // sauvegarde de tous les sites
  sitesSelected: MatTableDataSource<Site>= new MatTableDataSource();

  selectedDepartement: string = "";
  selectedRegion: string = "";
  selectedType: string ="";
  selectedHabitat: string = "";
  uniqueDepartements: string[] = [];
  uniqueRegions: string[] = [];
  uniqueTypes: string[] = [];
  uniqueHabitats: string[] = [];
  sites:Site[]=[];
  reinitialisation = 'Réinitialiser ce filtre';
  private siteService = inject(SiteService);
  private sitesSub!: Subscription;
  title="Choisir les sites";
  titleChosenSites="Sites choisis";

  ngOnInit(): void {
    
    this.sitesSub = this.siteService.getAll().subscribe(sites => {
      
      this.siteService.sortByName(sites);
      this.sitesOriginal = sites;
      this.sites = sites;
      this.sitesSelected = new MatTableDataSource(this.sites);
      this.extractUniqueFilters();
      return this.sites = sites;
    });;
   
  }

  extractUniqueFilters() {
    this.uniqueDepartements = Array.from(new Set(this.sites.flatMap(site =>
      site.departements.map(dep => dep.nom_dep))));
  
    this.uniqueRegions = Array.from(new Set(this.sites.flatMap(site =>
      site.departements.map(dep => dep.region.nom_reg))));
  
    this.uniqueTypes = Array.from(new Set(this.sites.map(site =>
      site.type?.libelle).filter(Boolean)));
  
    this.uniqueHabitats = Array.from(new Set(this.sites.flatMap(site =>
      site.habitats.map(hab => hab.libelle))));
  }
  
  applyFilters() {
    
    this.sitesSelected.data = this.sites.filter(site => {
      const matchDep = !this.selectedDepartement || site.departements.some(dep => dep.nom_dep === this.selectedDepartement);
      const matchReg = !this.selectedRegion || site.departements.some(dep => dep.region.nom_reg === this.selectedRegion);
      const matchType = !this.selectedType || site.type?.libelle === this.selectedType;
      const matchHab = !this.selectedHabitat || site.habitats.some(hab => hab.libelle === this.selectedHabitat);
  
      return matchDep && matchReg && matchType && matchHab;
    });
    this.sites = this.sitesSelected.data;
    
  }

  resetFilters() {
    this.selectedDepartement = "";
    this.selectedRegion = "";
    this.selectedType = "";
    this.selectedHabitat = "";
    this.sites = this.sitesOriginal;
  }
  
  ngOnDestroy(): void {
    this.sitesSub?.unsubscribe();
  }

}
