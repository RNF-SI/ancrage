import { CommonModule } from "@angular/common";
import { Component, computed, effect, inject, input, signal, OnDestroy } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { Site } from "@app/models/site.model";
import { Router } from "@angular/router";
import { SiteService } from "@app/services/sites.service";
import { Diagnostic } from "@app/models/diagnostic.model";
import { MapComponent } from "../map/map.component";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSelectModule } from "@angular/material/select";
import { MatInputModule } from "@angular/material/input";
import { MatSlideToggleModule } from "@angular/material/slide-toggle";
import { MatIconModule } from "@angular/material/icon";
import { FormsModule } from "@angular/forms";
import { Labels } from "@app/utils/labels";
import { AuthService } from "@app/home-rnf/services/auth-service.service";
import { StateService } from "@app/services/state.service";

@Component({
  selector: "app-sites-diagnostics-view",
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MapComponent,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatSlideToggleModule,
    MatIconModule,
    FormsModule,
  ],
  templateUrl: "./sites-diagnostics-view.component.html",
  styleUrls: ["./sites-diagnostics-view.component.css"],
})
export class SitesDiagnosticsViewComponent implements OnDestroy {
  readonly sites = input<Site[]>([]);
  readonly titleBtnCreaDiag = input("Ajouter un diagnostic");
  readonly title = input("");
  readonly diagnostic = input<Diagnostic>(new Diagnostic());

  private siteService = inject(SiteService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private stateService = inject(StateService);

  private sitesEffectCleanup?: () => void;
  private userEffectCleanup?: () => void;

  readonly sitesOriginal = signal<Site[]>([]);
  readonly selectedDepartement = signal("");
  readonly selectedRegion = signal("");
  readonly selectedType = signal("");
  readonly searchSiteName = signal("");
  readonly onlyMyDiagnostics = signal(false);
  readonly selectedAnnee = signal<number | null>(null);

  private getDiagnosticAnnee(diag: Diagnostic): number | null {
    if (diag.annee) return diag.annee;
    const fromNom = Diagnostic.extractAnneeFromNom(diag.nom);
    if (fromNom) return fromNom;
    if (diag.created_at) return new Date(diag.created_at).getFullYear();
    return null;
  }

  private diagnosticMatchesFilters(diag: Diagnostic, userId: number): boolean {
    if (this.onlyMyDiagnostics() && diag.created_by !== userId) return false;
    const year = this.selectedAnnee();
    if (year !== null && this.getDiagnosticAnnee(diag) !== year) return false;
    return true;
  }

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

  readonly filteredSiteList = computed(() => {
    let list = this.sitesSelected();
    const q = this.searchSiteName();

    if (q) {
      const search = q
        .toLowerCase()
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "");

      list = list.filter((site) => {
        const nom = (site.nom ?? "").toLowerCase();
        const normalized = nom.normalize("NFD").replace(/\p{Diacritic}/gu, "");
        return normalized.includes(search);
      });
    }

    const userId = this.user_id();
    if (this.onlyMyDiagnostics() || this.selectedAnnee() !== null) {
      list = list.filter((site) =>
        (site.diagnostics ?? []).some((diag) => this.diagnosticMatchesFilters(diag, userId))
      );
    }

    return list;
  });

  readonly mapSiteList = computed(() => {
    const list = this.filteredSiteList();
    const userId = this.user_id();

    if (!this.onlyMyDiagnostics() && this.selectedAnnee() === null) return list;

    return list.map((site) => {
      const copy = site.copy();
      copy.diagnostics = (site.diagnostics ?? []).filter((diag) =>
        this.diagnosticMatchesFilters(diag, userId)
      );
      return copy;
    });
  });

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

  readonly uniqueAnnees = computed(() => {
    const years = new Set<number>();
    for (const site of this.sitesOriginal()) {
      for (const diag of site.diagnostics ?? []) {
        const year = this.getDiagnosticAnnee(diag);
        if (year) years.add(year);
      }
    }
    return Array.from(years).sort((a, b) => b - a);
  });

  readonly reinitialisation = "Réinitialiser";
  readonly labels = new Labels();
  readonly user_id = signal(0);
  readonly id_organisme = signal(0);
  mapInstanceKey = Date.now();

  constructor() {
    const sitesEffectRef = effect(() => {
      const inputSites = this.sites();
      const arr = [...inputSites];
      if (arr.length > 0) {
        this.siteService.sortByName(arr);
      }
      this.sitesOriginal.set(arr);
    });
    this.sitesEffectCleanup = () => sitesEffectRef.destroy();

    const userEffectRef = effect(() => {
      const user = this.authService.getCurrentUser();
      this.user_id.set(user.id_role);
      this.id_organisme.set(user.id_organisme);
      this.stateService.clearAll();
      this.stateService.setPreviousPage(this.router.url);
    });
    this.userEffectCleanup = () => userEffectRef.destroy();
  }

  applyFilters() {}

  resetFilters() {
    this.selectedDepartement.set("");
    this.selectedRegion.set("");
    this.selectedType.set("");
    this.searchSiteName.set("");
    this.onlyMyDiagnostics.set(false);
    this.selectedAnnee.set(null);
  }

  onSearchChange(value: string) {
    this.searchSiteName.set(value ?? "");
  }

  navigate(path: string, diagnostic: Diagnostic, site?: Site) {
    const diagToStore = Object.assign(new Diagnostic(), diagnostic, {
      created_by: this.user_id(),
      id_organisme: this.id_organisme(),
    });

    this.siteService.navigateAndCache(path, diagToStore, site);
  }

  openDiagnostic(event: { id: number; slug: string; site: Site }) {
    this.navigate(`/diagnostic-visualisation/${event.id}/${event.slug}`, this.diagnostic(), event.site);
  }

  createDiagnostic() {
    this.navigate('/diagnostic/create', this.diagnostic());
  }

  createDiagnosticForSite(site: Site) {
    this.navigate('/diagnostic/create', this.diagnostic(), site);
  }

  ngOnDestroy(): void {
    this.sitesEffectCleanup?.();
    this.userEffectCleanup?.();
  }
}
