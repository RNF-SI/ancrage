import { CommonModule } from "@angular/common";
import { Component, computed, effect, inject, input, signal, OnDestroy, DestroyRef } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatTooltipModule } from "@angular/material/tooltip";
import { Site } from "@app/models/site.model";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { RouterModule, Router } from "@angular/router";
import { SiteService } from "@app/services/sites.service";
import { Diagnostic } from "@app/models/diagnostic.model";
import { MapComponent } from "../map/map.component";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSelectModule } from "@angular/material/select";
import { MatInputModule } from "@angular/material/input";
import { FormsModule } from "@angular/forms";
import { AlerteVisualisationSiteComponent } from "../../alertes/alerte-visualisation-site/alerte-visualisation-site.component";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { Labels } from "@app/utils/labels";
import { MatExpansionModule } from "@angular/material/expansion";
import { AuthService } from "@app/home-rnf/services/auth-service.service";
import { StateService } from "@app/services/state.service";

@Component({
  selector: "app-sites-diagnostics-view",
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
    MatExpansionModule,
  ],
  templateUrl: "./sites-diagnostics-view.component.html",
  styleUrls: ["./sites-diagnostics-view.component.css"],
})
export class SitesDiagnosticsViewComponent implements OnDestroy {
  readonly sites = input<Site[]>([]);
  readonly titleBtnCreaDiag = input("Nouveau diagnostic");
  readonly infobulleCreaDiagFromSite = input(
    "Le site indiqué sur cette ligne sera présélectionné lors de la création du diagnostic."
  );
  readonly infobulleCreaDiagFromScratch = input(
    "Utilisez ce bouton si le diagnostic comprend plusieurs sites ou si le site ciblé n'est pas dans la liste ci-dessous."
  );
  readonly title = input("");
  readonly diagnostic = input<Diagnostic>(new Diagnostic());

  private siteService = inject(SiteService);
  private authService = inject(AuthService);
  private dialog = inject(MatDialog);
  private router = inject(Router);
  private stateService = inject(StateService);
  private destroyRef = inject(DestroyRef);

  // Références aux effets pour nettoyage explicite
  private sitesEffectCleanup?: () => void;
  private userEffectCleanup?: () => void;
  
  // Références aux dialogues ouverts pour nettoyage si nécessaire
  private openDialogs: MatDialogRef<any>[] = [];

  displayedColumns = ["nom", "regions", "departements", "type", "choix"];

  readonly sitesOriginal = signal<Site[]>([]);
  readonly selectedDepartement = signal("");
  readonly selectedRegion = signal("");
  readonly selectedType = signal("");
  readonly searchSiteName = signal("");

  /**
   * Fully reactive selection based on filters (département / région / type)
   */
  readonly sitesSelected = computed(() => {
    const dep = this.selectedDepartement();
    const reg = this.selectedRegion();
    const type = this.selectedType();

    const list = this.sitesOriginal();
    return list.filter((site) => {
      const matchDep = !dep || site.departements?.some((d) => d.nom_dep === dep);
      const matchReg = !reg || site.departements?.some((d) => d.region?.nom_reg === reg);
      const matchType = !type || site.type?.libelle === type;
      return matchDep && matchReg && matchType;
    });
  });

  /**
   * Name search layered on top of the main selection; accent-insensitive
   */
  readonly filteredSiteList = computed(() => {
    const q = this.searchSiteName();
    if (!q) return this.sitesSelected();

    const search = q
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "");

    return this.sitesSelected().filter((site) => {
      const nom = (site.nom ?? "").toLowerCase();
      const normalized = nom.normalize("NFD").replace(/\p{Diacritic}/gu, "");
      return normalized.includes(search);
    });
  });

  /**
   * Unique lists for filter dropdowns (no empty strings)
   */
  readonly uniqueDepartements = computed(() => {
    const all = this
      .sitesOriginal()
      .flatMap((s) => s.departements?.map((d) => d.nom_dep) ?? []);
    const vals = all.filter((v): v is string => !!v && v.trim() !== "");
    return Array.from(new Set(vals)).sort();
  });

  readonly uniqueRegions = computed(() => {
    const all = this
      .sitesOriginal()
      .flatMap((s) => s.departements?.map((d) => d.region?.nom_reg) ?? []);
    const vals = all.filter((v): v is string => !!v && v.trim() !== "");
    return Array.from(new Set(vals)).sort();
  });

  readonly uniqueTypes = computed(() => {
    const all = this.sitesOriginal().map((s) => s.type?.libelle);
    const vals = all.filter((v): v is string => !!v && v.trim() !== "");
    return Array.from(new Set(vals)).sort();
  });

  readonly reinitialisation = "Réinitialiser";
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
  readonly modify = "Modifier";

  constructor() {
    // Initialize & keep sitesOriginal sorted whenever input sites changes
    const sitesEffectRef = effect(() => {
      const inputSites = this.sites();
      if (inputSites.length > 0) {
        const arr = [...inputSites];
        this.siteService.sortByName(arr); // assumes in-place sort of the copy
        this.sitesOriginal.set(arr);
      }
    });
    // Stocker la fonction de nettoyage
    this.sitesEffectCleanup = () => sitesEffectRef.destroy();

    // Init user context & navigation state (runs once)
    const userEffectRef = effect(() => {
      const user = this.authService.getCurrentUser();
      this.user_id.set(user.id_role);
      this.id_organisme.set(user.id_organisme);
      this.btnForDiagnosticsLbl.set(this.btnToShowDiagnosticsLbl);
      this.stateService.clearAll();
      this.stateService.setPreviousPage(this.router.url);
    });
    // Stocker la fonction de nettoyage
    this.userEffectCleanup = () => userEffectRef.destroy();
  }

  // Kept for template compatibility: filtering is now fully reactive
  applyFilters() {
    // no-op: computed(sitesSelected) reacts to selected* signals
  }

  resetFilters() {
    this.selectedDepartement.set("");
    this.selectedRegion.set("");
    this.selectedType.set("");
    this.searchSiteName.set("");
  }

  onSearchChange(value: string) {
    this.searchSiteName.set(value ?? "");
  }

  navigate(path: string, diagnostic: Diagnostic, site?: Site) {
    // Avoid mutating the @Input() instance; clone into a fresh Diagnostic
    const diagToStore = Object.assign(new Diagnostic(), diagnostic, {
      created_by: this.user_id(),
      id_organisme: this.id_organisme(),
    });

    this.siteService.navigateAndCache(path, diagToStore, site);
  }

  showSiteDetails(site: Site) {
    const dialogRef = this.dialog.open(AlerteVisualisationSiteComponent, {
      data: {
        site,
        labels: this.labels,
        can_edit: this.user_id() === site.created_by,
      },
    });
    
    // Stocker la référence pour nettoyage si nécessaire
    this.openDialogs.push(dialogRef);
    
    // Nettoyer automatiquement la référence quand le dialogue se ferme
    dialogRef.afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        const index = this.openDialogs.indexOf(dialogRef);
        if (index > -1) {
          this.openDialogs.splice(index, 1);
        }
      });
  }

  ngOnDestroy(): void {
    // Nettoyer explicitement les effets
    this.sitesEffectCleanup?.();
    this.userEffectCleanup?.();
    
    // Fermer tous les dialogues ouverts si le composant est détruit
    this.openDialogs.forEach(dialogRef => {
      try {
        if (dialogRef && dialogRef.componentInstance) {
          dialogRef.close();
        }
      } catch (error) {
        // Le dialogue peut déjà être fermé, ignorer l'erreur
        console.debug('Dialog already closed:', error);
      }
    });
    this.openDialogs = [];
  }
}
