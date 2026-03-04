import { CommonModule } from '@angular/common';
import { Component, effect, inject, OnDestroy, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatListModule } from '@angular/material/list';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { AlerteDiagnosticComponent } from '@app/components/alertes/alerte-diagnostic/alerte-diagnostic.component';
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
import { forkJoin, Subscription } from 'rxjs';
import { AlerteShowActorDetailsComponent } from '../../alertes/alerte-show-actor-details/alerte-show-actor-details.component';

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
    FontAwesomeModule
  ]
})
export class ImportActeursComponent implements OnDestroy {

  readonly labels = new Labels();
  readonly titleChooseActors = 'Importer des acteurs';
  readonly titleGetActors = "Récupérer les acteurs d'un précédent diagnostic sur les sites choisis";
  readonly reinitialisation = 'Réinitialiser';
  readonly emptyChosenActorsTxt = "Vous n'avez pas encore choisi d'acteurs.";

  formGroup!: FormGroup;
  chosenActors: string[] = [this.emptyChosenActorsTxt];

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

  private siteSub?: Subscription;
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

      const diag = this.stateService.getCurrentDiagnostic();
      if (diag?.id_diagnostic === id) {
        this.diag.set(diag);
      }

      forkJoin([
        this.departementService.getAll(),
        this.nomenclatureService.getAllByType('categories')
      ]).subscribe(([departements, categories]) => {
        this.uniqueDepartments.set(departements);
        this.uniqueCategories.set(categories);
        const sites = this.diag().sites || [];
        if (sites.length > 0) {
          this.loadActors(sites);
        }
      });
    });
  }

  private loadActors(sites: Site[]): void {
    const ids = sites.map(s => s.id_site);
    const json = { id_sites: ids };
    const nom = 'Diagnostic - ' + sites.map(s => s.nom).join(' ') + ' - ' + new Date().getFullYear();
    this.diag().nom = nom;

    this.siteSub = forkJoin([
      this.diagnosticService.getAllBySites(json),
      this.actorService.getAllBySItes(json)
    ]).subscribe(([diagnostics, acteurs]) => {
      this.instructionsWithResults(acteurs);
      this.setActors(this.diag());
      this.uniqueDiagnostics.set(diagnostics);
    });
  }

  compareActors = (a: Acteur, b: Acteur) => a?.id_acteur === b?.id_acteur;

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

  addOrRemoveActor(actor: Acteur, is_creation?: boolean): void {
    if (is_creation) {
      actor.selected = !actor.selected;
    }
    const selected = this.acteurs().filter(a => a.selected);
    this.formGroup.get('acteurs')?.setValue(selected);

    if (actor.selected) {
      if (this.chosenActors.includes(this.emptyChosenActorsTxt)) {
        this.chosenActors = [];
      }
      this.chosenActors.push(actor.nom + ' ' + actor.prenom);
    } else if (is_creation) {
      const idx = this.chosenActors.indexOf(actor.nom + ' ' + actor.prenom);
      if (idx >= 0) this.chosenActors.splice(idx, 1);
      if (this.chosenActors.length === 0) {
        this.chosenActors.push(this.emptyChosenActorsTxt);
      }
    }
  }

  processActors(): void {
    if (this.diag().id_diagnostic <= 0) return;
    this.chosenActors = [];
    for (const acteur of this.acteurs()) {
      this.addOrRemoveActor(acteur);
    }
  }

  private instructionsWithResults(acteurs: Acteur[]): void {
    this.uniqueActors.set(acteurs);
    for (const a of acteurs) {
      const dpt = a.commune?.departement;
      if (dpt && !this.uniqueDepartments().some(d => d.id_dep === dpt.id_dep)) {
        this.uniqueDepartments.update(list => [...list, dpt]);
      }
      for (const cat of a.categories || []) {
        if (!this.uniqueCategories().some(c => c.id_nomenclature === cat.id_nomenclature)) {
          this.uniqueCategories.update(list => [...list, cat]);
        }
      }
    }
    this.actorService.sortByNameAndSelected(this.uniqueActors());
    this.departementService.sortByName(this.uniqueDepartments());
    this.nomenclatureService.sortByName(this.uniqueCategories());
  }

  private setActors(diag: Diagnostic): void {
    const fromDiag = diag.acteurs || [];
    for (const acteur of fromDiag) {
      if (!this.uniqueActors().some(a => a.id_acteur === acteur.id_acteur)) {
        this.uniqueActors.update(list => [...list, acteur]);
      }
    }
    const remapped = fromDiag.map(act =>
      this.uniqueActors().find(a => a.id_acteur === act.id_acteur) ?? act
    );
    const selectedIds = new Set(remapped.map(a => a.id_acteur));
    this.uniqueActors().forEach(actor => {
      actor.selected = selectedIds.has(actor.id_acteur);
    });
    this.acteurs.set([...this.uniqueActors()]);
    this.actorService.sortByNameAndSelected(this.acteurs());
    this.actorsOriginal.set(this.acteurs());
    this.processActors();
  }

  recordActors(): void {
    const selected = this.acteurs().filter(a => a.selected);
    if (selected.length === 0) return;
    const newDiag = this.diag();
    newDiag.acteurs = selected;
    this.diagnosticService.update(Diagnostic.fromJson(newDiag)).subscribe(updated => {
      this.setActors(updated);
      this.showConfirmation('Le diagnostic contient désormais ces informations :', updated);
    });
  }

  private showConfirmation(message: string, diag: Diagnostic): void {
    this.stateService.setPageFromActor('oui');
    this.dialog.open(AlerteDiagnosticComponent, {
      data: {
        title: this.labels.addActors,
        message,
        labels: this.labels,
        diagnostic: diag,
        previousPage: this.previousPage,
        no_creation: false
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
  }
}
