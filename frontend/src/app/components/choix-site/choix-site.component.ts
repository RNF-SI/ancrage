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
import { Diagnostic } from '@app/models/diagnostic.model';
import { AuthService } from '@app/home-rnf/services/auth-service.service';
import { Router, RouterModule, Routes } from '@angular/router';

@Component({
  selector: 'app-choix-site',
  templateUrl: './choix-site.component.html',
  styleUrls: ['./choix-site.component.css'],
  standalone:true,
  imports:[MapComponent,CommonModule,MatTableModule,MatCheckboxModule,FormsModule,MatSelectModule,MatFormFieldModule,MatButtonModule]
})

export class ChoixSiteComponent {
 
  displayedColumns: string[] = ['nom', 'regions','departements', 'type','habitats','choix'];
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
  reinitialisation = 'Réinitialiser';
  regionLabel = "Régions";
  departmentLabel = "Départements";
  housingLabel = "Habitats";
  statusLabel = "Statut";
  nameLabel = "Nom";
  btnToChooseLabel = "Choisir";
  btnNewSiteLabel = "Nouveau site"
  private siteService = inject(SiteService);
  private sitesSub!: Subscription;
  title="Choisir les sites";
  titleChosenSites="Sites choisis";
  diagnostic:Diagnostic = new Diagnostic();
  emptyChosenSites = "Vous n'avez pas encore choisi de sites.";
  chosenSites:String[]=[this.emptyChosenSites];
  private authService = inject(AuthService);
  private router = inject(Router);

  ngOnInit(): void {
    
    this.sitesSub = this.siteService.getAll().subscribe(sites => {
      
      this.siteService.sortByName(sites);
      this.sitesOriginal = sites;
      this.sites = sites;
      console.log(this.sites);
      this.sitesSelected = new MatTableDataSource(this.sites);
      this.extractUniqueFilters();
      return this.sites = sites;
    });;
    let user_id = this.authService.getCurrentUser().id_role;
    let id_organisme = this.authService.getCurrentUser().id_organisme;
    this.diagnostic.created_by = user_id;
    this.diagnostic.id_organisme = id_organisme;
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
  
    this.sitesSelected.data = this.sitesOriginal.filter(site => {
      const matchDep = !this.selectedDepartement || site.departements.some(dep => dep.nom_dep === this.selectedDepartement);
      const matchReg = !this.selectedRegion || site.departements.some(dep => dep.region.nom_reg === this.selectedRegion);
      const matchType = !this.selectedType || site.type?.libelle === this.selectedType;
      const matchHab = !this.selectedHabitat || site.habitats.some(hab => hab.libelle === this.selectedHabitat);
  
      return matchDep && matchReg && matchType /* && matchHab */;
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

  addOrRemoveSite(site:Site){
    console.log(site.selected);
    if (site.selected){
      this.diagnostic.sites.push(site);
      console.log(this.diagnostic);
      if(this.chosenSites.includes(this.emptyChosenSites)){
        this.chosenSites=[];
        
      }
      this.chosenSites.push(site.nom);
    }else{
      let iteration=0;
      for(let i=0;i<this.diagnostic.sites.length;i++){
        if(this.diagnostic.sites[i].id_site === site.id_site){
         iteration = i;
         break;
        }
        
      }
      this.diagnostic.sites.splice(iteration,1);
      console.log(this.diagnostic);
      
      for(let i=0;i<this.chosenSites.length;i++){
        if(this.chosenSites[i] === site.nom){
         iteration = i;
         break;
        }
        
      }
      this.chosenSites.splice(iteration,1);
      if(this.chosenSites.length == 0){
        this.chosenSites.push(this.emptyChosenSites);
      }
    }
    

  }

  toBrandNewSite(){
    localStorage.setItem("diagnostic", JSON.stringify(this.diagnostic));
    this.router.navigate(['/site']);
  }
  
  ngOnDestroy(): void {
    this.sitesSub?.unsubscribe();
  }

}
