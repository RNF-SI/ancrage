import { CommonModule } from "@angular/common";
import {
  Component,
  computed,
  effect,
  inject,
  input,
  OnDestroy,
  signal
} from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatTooltipModule } from "@angular/material/tooltip";
import { Site } from "@app/models/site.model";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { RouterModule, Router } from '@angular/router';
import { SiteService } from "@app/services/sites.service";
import { Diagnostic } from "@app/models/diagnostic.model";
import { MapComponent } from "../map/map.component";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSelectModule } from "@angular/material/select";
import { MatInputModule } from "@angular/material/input";
import { FormsModule } from "@angular/forms";
import { AlerteVisualisationSiteComponent } from "../../alertes/alerte-visualisation-site/alerte-visualisation-site.component";
import { MatDialog } from "@angular/material/dialog";
import { Labels } from "@app/utils/labels";
import { MatExpansionModule } from '@angular/material/expansion';
import { AuthService } from "@app/home-rnf/services/auth-service.service";
import { StateService } from "@app/services/state.service";

@Component({
  selector: 'app-sites-diagnostics-view',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatTooltipModule,
    FontAwesomeModule,
    RouterModule,
    MapComponent,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    FormsModule,
    MatExpansionModule
  ],
  templateUrl: './sites-diagnostics-view.component.html',
  styleUrls: ['./sites-diagnostics-view.component.css']
})
export class SitesDiagnosticsViewComponent {

  readonly sites = input<Site[]>([]);
  readonly titleBtnCreaDiag = input("Nouveau diagnostic");
  readonly infobulleCreaDiagFromSite = input("Le site indiqué sur cette ligne sera présélectionné lors de la création du diagnostic.");
  readonly infobulleCreaDiagFromScratch = input("Utilisez ce bouton si le diagnostic comprend plusieurs sites ou si le site ciblé n'est pas dans la liste ci-dessous.");
  readonly title = input("");
  readonly diagnostic = input<Diagnostic>(new Diagnostic());

  private siteService = inject(SiteService);
  private authService = inject(AuthService);
  private dialog = inject(MatDialog);
  private router = inject(Router);

  displayedColumns = ['nom', 'regions', 'departements', 'type', 'choix'];

  readonly sitesOriginal = signal<Site[]>([]);
  readonly selectedDepartement = signal("");
  readonly selectedRegion = signal("");
  readonly selectedType = signal("");
  readonly searchSiteName = signal("");

  readonly filteredSiteList = computed(() => {
    const search = this.searchSiteName().toLowerCase();
    return this.sitesSelected().filter(site =>
      site.nom.toLowerCase().includes(search)
    );
  });

  readonly sitesSelected = signal<Site[]>([]);

  readonly uniqueDepartements = computed(() =>
    Array.from(new Set(this.sitesOriginal().flatMap(s => s.departements.map(d => d.nom_dep)))).sort()
  );

  readonly uniqueRegions = computed(() =>
    Array.from(new Set(this.sitesOriginal().flatMap(s => s.departements.map(d => d.region.nom_reg)))).sort()
  );

  readonly uniqueTypes = computed(() =>
    Array.from(new Set(this.sitesOriginal().map(s => s.type?.libelle).filter(Boolean as any))).sort()
  );

  readonly reinitialisation = 'Réinitialiser';
  readonly btnToChooseLabel = "Choisir";
  readonly btnNewSiteLabel = "Nouveau site";
  readonly btnToChooseActors = "Choix des acteurs";
  readonly titleChosenSites = "Sites choisis";
  readonly emptyChosenSites = "Vous n'avez pas encore choisi de sites.";
  readonly btnToShowDiagnosticsLbl = "Afficher diagnostics";
  readonly btnToHideDiagnosticsLbl = "Masquer les diagnostics";

  readonly labels = new Labels();
  readonly chosenSites = signal<string[]>([this.emptyChosenSites]);

  readonly user_id = signal(0);
  readonly id_organisme = signal(0);
  readonly btnForDiagnosticsLbl = signal("");

  mapInstanceKey = Date.now();
  readonly showMoreInfo = "Afficher les détails";
  readonly modify = "Modifier"
  private stateService = inject(StateService)

  constructor() {

    effect(() => {
      if (this.sites().length > 0) {
        this.siteService.sortByName(this.sites());
        this.sitesOriginal.set(this.sites());
        this.sitesSelected.set(this.sites());
      }
    });

    effect(() => {
      const user = this.authService.getCurrentUser();
      this.user_id.set(user.id_role);
      this.id_organisme.set(user.id_organisme);
      this.btnForDiagnosticsLbl.set(this.btnToShowDiagnosticsLbl);
      this.stateService.clearAll();
      this.stateService.setPreviousPage(this.router.url);
    });
  }

  applyFilters() {
    const dep = this.selectedDepartement();
    const reg = this.selectedRegion();
    const type = this.selectedType();

    const filtered = this.sitesOriginal().filter(site => {
      const matchDep = !dep || site.departements.some(d => d.nom_dep === dep);
      const matchReg = !reg || site.departements.some(d => d.region.nom_reg === reg);
      const matchType = !type || site.type?.libelle === type;
      return matchDep && matchReg && matchType;
    });

    this.sitesSelected.set(filtered);
  }

  resetFilters() {
    this.selectedDepartement.set("");
    this.selectedRegion.set("");
    this.selectedType.set("");
    this.searchSiteName.set("");
    this.sitesSelected.set(this.sitesOriginal());
  }

  onSearchChange(value: string) {
    this.searchSiteName.set(value);
  }

  navigate(path: string, diagnostic: Diagnostic, site?: Site) {
    let diagToStore = diagnostic;
    diagToStore.created_by = this.user_id();
    diagToStore.id_organisme = this.id_organisme();
    
    this.siteService.navigateAndCache(path, diagToStore, site);
  }

  showSiteDetails(site: Site) {
    this.dialog.open(AlerteVisualisationSiteComponent, {
      data: {
        site,
        labels: this.labels,
        can_edit: this.user_id() === site.created_by
      }
    });
  }

}
