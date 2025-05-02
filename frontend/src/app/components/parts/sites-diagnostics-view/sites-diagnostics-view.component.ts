import { CommonModule } from "@angular/common";
import { Component, inject, Input, OnDestroy, OnInit } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatTooltipModule } from "@angular/material/tooltip";
import { Site } from "@app/models/site.model";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { Router, RouterModule } from '@angular/router';
import { SiteService } from "@app/services/sites.service";
import { Diagnostic } from "@app/models/diagnostic.model";
import { MapComponent } from "../map/map.component";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSelectModule } from "@angular/material/select";
import { Subscription } from "rxjs/internal/Subscription";
import { MatTableDataSource } from "@angular/material/table";
import { AuthService } from "@app/home-rnf/services/auth-service.service";
import { FormsModule } from "@angular/forms";
import { MatInputModule } from "@angular/material/input";
import { AlerteVisualisationSiteComponent } from "../alerte-visualisation-site/alerte-visualisation-site.component";
import { MatDialog } from "@angular/material/dialog";

@Component({
  selector: 'app-sites-diagnostics-view',
  templateUrl: './sites-diagnostics-view.component.html',
  styleUrls: ['./sites-diagnostics-view.component.css'],
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatTooltipModule, FontAwesomeModule,RouterModule,MapComponent,MatFormFieldModule,MatSelectModule,FormsModule,MatInputModule]
})
export class SitesDiagnosticsViewComponent implements OnInit,OnDestroy{

  @Input() sites: Site[] = [];
  @Input() titleBtnCreaDiag = "Nouveau diagnostic";
	@Input() infobulleCreaDiagFromSite="Le site indiqué sur cette ligne sera présélectionné lors de la création du diagnostic.";
	@Input() infobulleCreaDiagFromScratch = "Utilisez ce bouton si le diagnostic comprend plusieurs sites ou si le site ciblé n'est pas dans la liste ci-dessous.";
  @Input() title="";
  @Input() diagnostic:Diagnostic = new Diagnostic();
  private siteService:SiteService = inject(SiteService);
  displayedColumns: string[] = ['nom', 'regions','departements', 'type',/* 'habitats', */'choix'];
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
  globales={};
  reinitialisation = 'Réinitialiser';
  btnToChooseLabel = "Choisir";
  btnNewSiteLabel = "Nouveau site";
  btnToChooseActors = "Choix des acteurs";

  labels = {
    departementLabel: "",
    housingLabel: "",
    statusLabel:"",
    nameLabel: "",
    latitudeLabel: "",
    longitudeLabel: "",
    btnRecordLabel: "",
    btnPreviousStepLabel: "",
    regionLabel: ""
  }
  private authService = inject(AuthService);
  private sitesSub!: Subscription;
  titleChosenSites="Sites choisis";
  emptyChosenSites = "Vous n'avez pas encore choisi de sites.";
  chosenSites:String[]=[this.emptyChosenSites];
  user_id:number = 0;
  id_organisme=0;
  searchSiteName: string = '';
  filteredSiteList: Site[] = [];
  btnToShowDiagnosticsLbl = "Afficher diagnostics";
  btnToHideDiagnosticsLbl = "Masquer les diagnostics";
  btnForDiagnosticsLbl = "";
  private dialog = inject(MatDialog);
  private router = inject(Router)

  filteredSites(sites?:Site[]):Site[] {
    if(sites){
     
      return this.sites = sites;
    }
    if (!this.searchSiteName) {
      return this.sitesOriginal;
    }
    const searchLower = this.searchSiteName.toLowerCase();
    return this.sitesOriginal.filter(site => site.nom.toLowerCase().includes(searchLower));

  }

  onSearchChange() {
    
    if (!this.searchSiteName) {
      this.filteredSiteList = this.sites;
    } else {
      const searchLower = this.searchSiteName.toLowerCase();
      this.filteredSiteList = this.sites.filter(site =>
        site.nom.toLowerCase().includes(searchLower)
      );
    }
  }

  ngOnInit(): void {
    this.btnForDiagnosticsLbl = this.btnToShowDiagnosticsLbl;
    this.labels = this.siteService.labels;
    this.sitesSub = this.siteService.getAll().subscribe(sites => {
    
      this.siteService.sortByName(sites);
      this.sitesOriginal = sites;
      this.sites = sites;
      this.sitesSelected = new MatTableDataSource(this.sitesOriginal);
      this.extractUniqueFilters();
      this.onSearchChange();
      this.sites = sites;
      return this.sites;
    });
    localStorage.removeItem("diagnostic");
    localStorage.removeItem("previousPage");
    this.user_id = this.authService.getCurrentUser().id_role;
    this.id_organisme = this.authService.getCurrentUser().id_organisme;
    localStorage.setItem("previousPage",this.router.url);
    
  }

  navigate(path:string,diagnostic:Diagnostic,site?:Site){
    if (localStorage.getItem("diagnostic")){
      
      return this.diagnostic = JSON.parse(localStorage.getItem("diagnostic")!);
    }else{
      this.diagnostic.created_by = this.user_id;
      this.diagnostic.id_organisme = this.id_organisme;
    }
    this.siteService.navigateAndReload(path,diagnostic,site);
  }
  extractUniqueFilters() {
    this.uniqueDepartements = Array.from(new Set(this.sites.flatMap(site =>
      site.departements.map(dep => dep.nom_dep))));
    this.uniqueDepartements.sort();
  
    this.uniqueRegions = Array.from(new Set(this.sites.flatMap(site =>
      site.departements.map(dep => dep.region.nom_reg))));
    
    this.uniqueTypes = Array.from(new Set(this.sites.map(site =>
      site.type?.libelle).filter(Boolean)));
  
    /* this.uniqueHabitats = Array.from(new Set(this.sites.flatMap(site =>
      site.habitats.map(hab => hab.libelle)))); */
  }
  
  applyFilters() {
  
    this.sitesSelected.data = this.sitesOriginal.filter(site => {
      const matchDep = !this.selectedDepartement || site.departements.some(dep => dep.nom_dep === this.selectedDepartement);
      const matchReg = !this.selectedRegion || site.departements.some(dep => dep.region.nom_reg === this.selectedRegion);
      const matchType = !this.selectedType || site.type?.libelle === this.selectedType;
      /* const matchHab = !this.selectedHabitat || site.habitats.some(hab => hab.libelle === this.selectedHabitat);
    */
      return matchDep && matchReg && matchType /* && matchHab */;
    });
    this.filteredSiteList = this.sitesSelected.data;
    
  }

  resetFilters() {
    this.selectedDepartement = "";
    this.selectedRegion = "";
    this.selectedType = "";
    /* this.selectedHabitat = ""; */
    this.filteredSiteList = this.sitesOriginal;
    this.sites = this.sitesOriginal;
    this.searchSiteName ="";

  }

  displayDiagnostics(site:Site){
    const element = document.querySelector(".diagnostics"+site.id_site);
    const buttonClass = document.querySelector(".btnToShowDiagnostics"+site.id_site);
    if (element?.classList.contains("hidden")){
      element.classList.remove('hidden');
      element.classList.add('displayed');
      buttonClass!.innerHTML = this.btnToHideDiagnosticsLbl;
    }else{
      element?.classList.remove('displayed');
      element?.classList.add('hidden');
      buttonClass!.innerHTML = this.btnToShowDiagnosticsLbl;
    }
  }

  ngOnDestroy(): void {
    this.sitesSub?.unsubscribe();
  }

  showSiteDetails(site:Site){
    this.dialog.open(AlerteVisualisationSiteComponent, {
              data: {
                site: site,
                labels: this.labels
              }
            });
  }

}