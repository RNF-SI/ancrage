import { CommonModule } from '@angular/common';
import { Component, effect, inject, OnDestroy, signal, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatListModule } from '@angular/material/list';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { Acteur } from '@app/models/acteur.model';
import { Departement } from '@app/models/departement.model';
import { Diagnostic } from '@app/models/diagnostic.model';
import { Nomenclature } from '@app/models/nomenclature.model';
import { Site } from '@app/models/site.model';
import { ActeurService } from '@app/services/acteur.service';
import { DepartementService } from '@app/services/departement.service';
import { DiagnosticService } from '@app/services/diagnostic.service';
import { NomenclatureService } from '@app/services/nomenclature.service';
import { SiteService } from '@app/services/sites.service';
import { StateService } from '@app/services/state.service';
import { Labels } from '@app/utils/labels';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { EMPTY, forkJoin, Subscription, switchMap } from 'rxjs';
import { AlerteShowActorDetailsComponent } from '../../alertes/alerte-show-actor-details/alerte-show-actor-details.component';
import { LoadingSpinnerComponent } from '@app/home-rnf/components/loading-spinner/loading-spinner.component';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-import-acteurs',
  templateUrl: './import-acteurs.component.html',
  styleUrls: ['./import-acteurs.component.css'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatListModule,
    MatButtonModule,
    MatTooltipModule,
    FontAwesomeModule,
    LoadingSpinnerComponent
  ]
})
export class ImportActeursComponent implements OnDestroy {

  readonly labels = new Labels();
  readonly titleChooseActors = 'Importer des acteurs';
  readonly titleGetActors = "Récupérer les acteurs d'un diagnostic précédent sur le(s) même(s) site(s)";
  readonly noOtherDiagnosticsMessage =
    "Aucun autre diagnostic n'a été réalisé sur ce(s) site(s). Il n'y a pas d'acteur à importer.";
  readonly noActorsOnOtherDiagnosticsMessage =
    "Les autres diagnostics sur ce(s) site(s) ne contiennent aucun acteur à importer.";
  readonly cancelLabel = 'Annuler';
  readonly submitLabel = 'Ajouter les acteurs sélectionnés';
  readonly alreadyImportedTooltip = 'Cet acteur est déjà présent dans le diagnostic';
  readonly successMessage = 'Les acteurs sélectionnés ont bien été ajoutés au diagnostic.';
  readonly reinitialisation = 'Réinitialiser';

  formGroup!: FormGroup;

  readonly diag = signal<Diagnostic>(new Diagnostic());
  readonly acteurs = signal<Acteur[]>([]);
  readonly uniqueDiagnostics = signal<Diagnostic[]>([]);
  readonly uniqueDepartments = signal<Departement[]>([]);
  readonly uniqueCategories = signal<Nomenclature[]>([]);
  readonly selectedDiagnostic = signal<Diagnostic>(new Diagnostic());
  readonly selectedDepartment = signal<Departement>(new Departement());
  readonly selectedCategory = signal<Nomenclature>(new Nomenclature());
  private readonly uniqueActors = signal<Acteur[]>([]);
  private readonly actorsOriginal = signal<Acteur[]>([]);
  readonly emptyStateMessage = signal<string | null>(null);
  readonly isLoading = signal(true);

  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(MatDialog);
  private readonly stateService = inject(StateService);
  private readonly siteService = inject(SiteService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly departementService = inject(DepartementService);
  private readonly nomenclatureService = inject(NomenclatureService);
  private readonly actorService = inject(ActeurService);
  private readonly diagnosticService = inject(DiagnosticService);
  private readonly toastr = inject(ToastrService);

  private siteSub?: Subscription;
  private lastLoadKey = '';
  private routeParams = toSignal(inject(ActivatedRoute).params, { initialValue: {} as Params });

  constructor() {
    this.formGroup = this.fb.group({
      acteurs: this.fb.control<Acteur[]>([], [Validators.required])
    });

    effect(() => {
      const params = this.routeParams();
      const id_diagnostic = params['id_diagnostic'];
      const slug = params['slug'];
      const id = Number(id_diagnostic);
      if (!id || !slug) return;

      const loadKey = `${id}/${slug}`;
      if (this.lastLoadKey === loadKey) return;

      untracked(() => {
        const diag = this.stateService.getCurrentDiagnostic();
        const currentDiag = diag?.id_diagnostic === id ? diag : this.diag();
        if (currentDiag.id_diagnostic === id) {
          this.diag.set(currentDiag);
        }

        const sites = currentDiag.sites || [];
        if (sites.length > 0) {
          this.lastLoadKey = loadKey;
          this.loadImportableActors(sites, id, String(slug));
        } else {
          this.isLoading.set(false);
          this.emptyStateMessage.set(this.noOtherDiagnosticsMessage);
        }
      });
    });
  }

  private loadImportableActors(sites: Site[], diagnosticId: number, slug: string): void {
    const json = {
      id_sites: sites.map(s => s.id_site),
      exclude_diagnostic_id: diagnosticId
    };
    this.isLoading.set(true);
    this.emptyStateMessage.set(null);

    this.siteSub?.unsubscribe();
    this.siteSub = this.diagnosticService.hasOtherOnSites(json).pipe(
      switchMap(hasOther => {
        if (!hasOther) {
          this.uniqueDiagnostics.set([]);
          this.updateEmptyStateMessage(0, 0);
          this.isLoading.set(false);
          return EMPTY;
        }
        this.diagnosticService.invalidateCache(diagnosticId, slug);
        return forkJoin({
          diagnostics: this.diagnosticService.getAllBySites(json),
          acteurs: this.actorService.getAllBySItes(json),
          currentDiag: this.diagnosticService.get(diagnosticId, slug)
        });
      })
    ).subscribe({
      next: ({ diagnostics, acteurs, currentDiag }) => {
        untracked(() => {
          this.diag.set(currentDiag);
          this.stateService.setDiagnostic(currentDiag);
        });
        this.uniqueDiagnostics.set(diagnostics);
        this.instructionsWithResults(acteurs);
        this.setActors();
        this.updateEmptyStateMessage(diagnostics.length, acteurs.length);
        this.isLoading.set(false);
        queueMicrotask(() => this.processActors());
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  private updateEmptyStateMessage(otherDiagnosticsCount: number, importableActorsCount: number): void {
    if (otherDiagnosticsCount === 0) {
      this.emptyStateMessage.set(this.noOtherDiagnosticsMessage);
      return;
    }
    if (importableActorsCount === 0) {
      this.emptyStateMessage.set(this.noActorsOnOtherDiagnosticsMessage);
      return;
    }
    this.emptyStateMessage.set(null);
  }

  compareActors = (a: Acteur, b: Acteur) => a?.id_acteur === b?.id_acteur;

  hasNewActorsToImport(): boolean {
    return this.acteurs().some(a => a.selected && !this.isAlreadyImported(a));
  }

  get previousPage(): string {
    return this.stateService.getCurrentPreviousPage() ?? '';
  }

  applyFilters(): void {
    const selectedCat = this.selectedCategory().id_nomenclature !== 0;
    const selectedDep = this.selectedDepartment().id_departement !== 0;
    const selectedDiag = this.selectedDiagnostic().id_diagnostic !== 0;

    const filtered = this.actorsOriginal().filter(actor => {
      const matchDep = !selectedDep || actor.commune?.departement?.nom_dep === this.selectedDepartment().nom_dep;
      const matchCat = !selectedCat || actor.categories?.some(c => c.id_nomenclature === this.selectedCategory().id_nomenclature);
      const matchDiag = !selectedDiag || actor.diagnostic?.id_diagnostic === this.selectedDiagnostic().id_diagnostic;
      return matchDep && matchCat && matchDiag;
    });

    this.acteurs.set(filtered);
    this.processActors();
  }

  resetFilters(): void {
    this.selectedDepartment.set(new Departement());
    this.selectedCategory.set(new Nomenclature());
    this.selectedDiagnostic.set(new Diagnostic());
    this.acteurs.set(this.actorsOriginal());
    this.processActors();
  }

  isAlreadyImported(importActor: Acteur): boolean {
    for (const current of this.diag().acteurs || []) {
      if (current.acteur_origine_id === importActor.id_acteur) {
        return true;
      }
      if (this.areSamePerson(current, importActor)) {
        return true;
      }
    }
    return false;
  }

  onActorClick(event: Event, actor: Acteur): void {
    if (this.isAlreadyImported(actor)) {
      event.preventDefault();
      event.stopPropagation();
      actor.selected = true;
      this.processActors();
      return;
    }
    this.addOrRemoveActor(actor, true);
  }

  addOrRemoveActor(actor: Acteur, is_creation?: boolean): void {
    if (this.isAlreadyImported(actor)) {
      actor.selected = true;
      this.processActors();
      return;
    }
    if (is_creation) {
      actor.selected = !actor.selected;
    }
    this.syncFormSelection();
  }

  private syncFormSelection(): void {
    const selected = this.acteurs().filter(a => a.selected);
    this.formGroup.get('acteurs')?.setValue(selected);
  }

  processActors(): void {
    if (this.diag().id_diagnostic <= 0) return;
    this.syncFormSelection();
  }

  private instructionsWithResults(acteurs: Acteur[]): void {
    this.uniqueActors.set(acteurs);
    const departments: Departement[] = [];
    const categories: Nomenclature[] = [];
    for (const a of acteurs) {
      const dpt = a.commune?.departement;
      if (dpt && !departments.some(d => d.id_dep === dpt.id_dep)) {
        departments.push(dpt);
      }
      for (const cat of a.categories || []) {
        if (!categories.some(c => c.id_nomenclature === cat.id_nomenclature)) {
          categories.push(cat);
        }
      }
    }
    this.departementService.sortByName(departments);
    this.nomenclatureService.sortByName(categories);
    this.uniqueDepartments.set(departments);
    this.uniqueCategories.set(categories);
    this.actorService.sortByNameAndSelected(this.uniqueActors());
  }

  private areSamePerson(a: Acteur, b: Acteur): boolean {
    return a.nom.trim().toLowerCase() === b.nom.trim().toLowerCase()
      && a.prenom.trim().toLowerCase() === b.prenom.trim().toLowerCase()
      && (a.mail?.trim().toLowerCase() || '') === (b.mail?.trim().toLowerCase() || '');
  }

  private setActors(): void {
    this.uniqueActors().forEach(actor => {
      actor.selected = this.isAlreadyImported(actor);
    });
    this.acteurs.set([...this.uniqueActors()]);
    this.actorService.sortByNameAndSelected(this.acteurs());
    this.actorsOriginal.set(this.acteurs());
    this.processActors();
  }

  recordActors(): void {
    const selected = this.acteurs().filter(a => a.selected);
    const newlySelected = selected.filter(a => !this.isAlreadyImported(a));
    if (newlySelected.length === 0) return;
    const newDiag = this.diag();
    newDiag.acteurs = selected;
    this.diagnosticService.update(Diagnostic.fromJson(newDiag)).subscribe({
      next: updated => {
        this.diagnosticService.invalidateCache(updated.id_diagnostic, updated.slug);
        this.stateService.setPageFromActor('oui');
        this.toastr.success(this.successMessage);
        const path = `/diagnostic-visualisation/${updated.id_diagnostic}/${updated.slug}`;
        this.siteService.navigateAndCache(path, updated);
      },
      error: () => {
        this.toastr.error('Erreur lors de l\'ajout des acteurs.');
      }
    });
  }

  showOtherInfos(actor: Acteur): void {
    this.dialog.open(AlerteShowActorDetailsComponent, {
      data: { title: this.labels.showMoreInfo, actor, labels: this.labels }
    });
  }

  navigate(path: string, diagnostic: Diagnostic, acteur?: Acteur): void {
    this.stateService.setPageFromActor('oui');
    if (acteur) this.stateService.setActor(acteur);
    this.stateService.setPageDiagnostic(this.router.url);
    this.siteService.navigateAndCache(path, diagnostic);
  }

  ngOnDestroy(): void {
    this.siteSub?.unsubscribe();
    this.lastLoadKey = '';
  }
}
