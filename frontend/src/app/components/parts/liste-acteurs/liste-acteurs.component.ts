import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Router } from '@angular/router';
import { AlerteStatutEntretienComponent } from '@app/components/alertes/alerte-statut-entretien/alerte-statut-entretien.component';
import { AlerteSuppressionActeurComponent } from '@app/components/alertes/alerte-suppression-acteur/alerte-suppression-acteur.component';
import { Acteur } from '@app/models/acteur.model';
import { Diagnostic } from '@app/models/diagnostic.model';
import { Nomenclature } from '@app/models/nomenclature.model';
import { NomenclatureService } from '@app/services/nomenclature.service';
import { SiteService } from '@app/services/sites.service';
import { StateService } from '@app/services/state.service';
import { Labels } from '@app/utils/labels';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { AlerteShowActorDetailsComponent } from '../../alertes/alerte-show-actor-details/alerte-show-actor-details.component';

@Component({
  selector: 'app-liste-acteurs',
  templateUrl: './liste-acteurs.component.html',
  styleUrls: ['./liste-acteurs.component.css'],
  imports: [
    CommonModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    FontAwesomeModule
  ]
})
export class ListeActeursComponent {

  readonly actors = input<Acteur[]>([]);
  readonly diagnostic = input<Diagnostic>(new Diagnostic());
  readonly isReadOnly = input<boolean>(false);

  delete = output<Acteur>();
  filteredActorsChange = output<Acteur[]>();

  labels = new Labels();
  reinitialisation = 'Réinitialiser';

  private readonly dialog = inject(MatDialog);
  private readonly nomenclatureService = inject(NomenclatureService);
  private readonly stateService = inject(StateService);
  private readonly siteService = inject(SiteService);
  private readonly router = inject(Router);

  private readonly acteurs = signal<Acteur[]>([]);
  filterSearch = signal('');
  filterCategoryIds = signal<number[]>([]);
  filterProfilIds = signal<number[]>([]);
  filterStatutEntretienIds = signal<number[]>([]);

  filterCategoriesOptions = computed(() => {
    const list = this.acteurs();
    const seen = new Set<number>();
    const out: Nomenclature[] = [];
    for (const a of list) {
      for (const c of a.categories || []) {
        if (c.id_nomenclature && !seen.has(c.id_nomenclature)) {
          seen.add(c.id_nomenclature);
          out.push(c);
        }
      }
    }
    this.nomenclatureService.sortByName(out);
    return out;
  });

  filterProfilsOptions = computed(() => {
    const list = this.acteurs();
    const seen = new Set<number>();
    const out: Nomenclature[] = [];
    for (const a of list) {
      const p = a.profil;
      if (p?.id_nomenclature && !seen.has(p.id_nomenclature)) {
        seen.add(p.id_nomenclature);
        out.push(p);
      }
    }
    this.nomenclatureService.sortByName(out);
    return out;
  });

  filterStatutsOptions = computed(() => {
    const list = this.acteurs();
    const seen = new Set<number>();
    const out: Nomenclature[] = [{ id_nomenclature: 0, libelle: 'À faire', value: 0, mnemonique: '', ordre: 0 } as Nomenclature];
    for (const a of list) {
      const s = a.statut_entretien;
      if (s?.id_nomenclature && s.libelle?.trim() && !seen.has(s.id_nomenclature)) {
        seen.add(s.id_nomenclature);
        out.push(s);
      }
    }
    const withStatuts = out.filter(o => o.id_nomenclature !== 0);
    this.nomenclatureService.sortByName(withStatuts);
    return [{ id_nomenclature: 0, libelle: 'À faire', value: 0, mnemonique: '', ordre: 0 } as Nomenclature, ...withStatuts];
  });

  filteredActeurs = computed(() => {
    const list = this.acteurs();
    const search = this.normalize(this.filterSearch());
    const catIds = this.filterCategoryIds();
    const profilIds = this.filterProfilIds();
    const statutIds = this.filterStatutEntretienIds();
    return list.filter(actor => {
      if (search) {
        const fullText = this.normalize([actor.nom, actor.prenom, actor.fonction, actor.structure].filter(Boolean).join(' '));
        if (!fullText.includes(search)) return false;
      }
      if (catIds.length > 0) {
        const actorCatIds = (actor.categories || []).map(c => c.id_nomenclature);
        if (!catIds.some(id => actorCatIds.includes(id))) return false;
      }
      if (profilIds.length > 0) {
        const pid = actor.profil?.id_nomenclature;
        if (pid === undefined || !profilIds.includes(pid)) return false;
      }
      if (statutIds.length > 0) {
        const sid = actor.statut_entretien?.id_nomenclature;
        const isAFaire = !actor.statut_entretien?.libelle?.trim();
        const matchAFaire = statutIds.includes(0) && isAFaire;
        const matchStatut = sid !== undefined && statutIds.includes(sid);
        if (!matchAFaire && !matchStatut) return false;
      }
      return true;
    });
  });

  constructor() {
    effect(() => this.acteurs.set(this.actors()));
    effect(() => this.filteredActorsChange.emit(this.filteredActeurs()));
  }

  private normalize(text: string): string {
    return (text || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }

  setFilterCategoryIds(ids: number[]) { this.filterCategoryIds.set(ids); }
  setFilterProfilIds(ids: number[]) { this.filterProfilIds.set(ids); }
  setFilterStatutEntretienIds(ids: number[]) { this.filterStatutEntretienIds.set(ids); }
  resetListFilters() {
    this.filterSearch.set('');
    this.filterCategoryIds.set([]);
    this.filterProfilIds.set([]);
    this.filterStatutEntretienIds.set([]);
  }

  getStatutEntretienLabel(actor: Acteur): string {
    const lib = actor.statut_entretien?.libelle;
    return (lib && lib.trim()) ? lib : 'À faire';
  }

  getCategoriesLabel(actor: Acteur): string {
    const cats = actor.categories || [];
    return cats.map(c => c.libelle).join(', ') || '—';
  }

  getStatutEntretienClass(actor: Acteur): string {
    const lib = actor.statut_entretien?.libelle;
    switch (lib) {
      case 'Réalisé': return 'statut-realized';
      case 'Reporté':
      case 'En cours':
      case 'Programmé': return 'statut-pending';
      case 'Annulé':
      case 'Rétracté': return 'statut-canceled';
      default: return 'statut-todo';
    }
  }

  openAlert(actor: Acteur) {
    this.dialog.open(AlerteStatutEntretienComponent, {
      data: { title: this.labels.modifyStateInterview, actor, labels: this.labels }
    });
  }

  openAlertDisable(acteur: Acteur) {
    const dialogRef = this.dialog.open(AlerteSuppressionActeurComponent, {
      data: {
        title: "Supprimer l'acteur",
        acteur,
        message: "Vous êtes sur le point de supprimer cet acteur. Etes-vous sûr-e de vouloir continuer ?"
      }
    });
    dialogRef.afterClosed().subscribe(acteurResult => {
      if (acteurResult) this.delete.emit(acteurResult);
    });
  }

  showOtherInfos(actor: Acteur) {
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
}
