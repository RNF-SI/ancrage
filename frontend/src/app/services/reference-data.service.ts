import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, BehaviorSubject, of, throwError } from 'rxjs';
import { map, shareReplay, tap, catchError } from 'rxjs/operators';
import { CommuneService } from './commune.service';
import { DepartementService } from './departement.service';
import { RegionService } from './region.service';
import { NomenclatureService } from './nomenclature.service';
import { SiteService } from './sites.service';
import { Commune } from '@app/models/commune.model';
import { Departement } from '@app/models/departement.model';
import { Region } from '@app/models/region.model';
import { Nomenclature } from '@app/models/nomenclature.model';
import { Site } from '@app/models/site.model';

/**
 * Interface pour le bundle de données de référence
 */
export interface ReferenceDataBundle {
  communes: Commune[];
  departements: Departement[];
  regions: Region[];
  categories: Nomenclature[];
  profils: Nomenclature[];
  statuts: Nomenclature[];
  habitats: Nomenclature[];
  sites: Site[];
  themes?: Nomenclature[];
  etats?: Nomenclature[];
  noResponse?: Nomenclature[];
}

/**
 * Interface pour les options de chargement
 */
export interface LoadReferenceDataOptions {
  includeSites?: boolean;
  includeThemes?: boolean;
  includeEtats?: boolean;
  includeNoResponse?: boolean;
  includeHabitats?: boolean;
  forceReload?: boolean;
}

/**
 * Service centralisé pour la gestion et le cache des données de référence
 * Élimine les appels forkJoin répétitifs dans les composants
 */
@Injectable({
  providedIn: 'root'
})
export class ReferenceDataService {

  private communeService = inject(CommuneService);
  private departementService = inject(DepartementService);
  private regionService = inject(RegionService);
  private nomenclatureService = inject(NomenclatureService);
  private siteService = inject(SiteService);

  // Cache des observables avec shareReplay
  private cache = new Map<string, Observable<any>>();
  
  // État de chargement global
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  /**
   * Récupère le bundle complet des données de référence avec cache
   */
  getReferenceData(options: LoadReferenceDataOptions = {}): Observable<ReferenceDataBundle> {
    const cacheKey = this.getCacheKey(options);
    
    if (!this.cache.has(cacheKey) || options.forceReload) {
      
      this.loadingSubject.next(true);
      
      // Préparer les observables selon les options
      const observables: any = {
        communes: this.getCachedObservable('communes', () => this.communeService.getAll()),
        departements: this.getCachedObservable('departements', () => this.departementService.getAll()),
        regions: this.getCachedObservable('regions', () => this.regionService.getAll()),
        categories: this.getCachedObservable('categories', () => this.nomenclatureService.getAllByType('categories')),
        profils: this.getCachedObservable('profils', () => this.nomenclatureService.getAllByType('profil')),
        statuts: this.getCachedObservable('statuts', () => this.nomenclatureService.getAllByType('statut'))
      };

      // Ajouter les données optionnelles
      if (options.includeHabitats !== false) {
        observables.habitats = this.getCachedObservable('habitats', () => this.nomenclatureService.getAllByType('habitats'));
      }
      
      if (options.includeSites) {
        observables.sites = this.getCachedObservable('sites', () => this.siteService.getAll());
      }
      
      if (options.includeThemes) {
        observables.themes = this.getCachedObservable('themes', () => this.nomenclatureService.getAllByType('theme'));
      }
      
      if (options.includeEtats) {
        observables.etats = this.getCachedObservable('etats', () => this.nomenclatureService.getAllByType('etat'));
      }
      
      if (options.includeNoResponse) {
        observables.noResponse = this.getCachedObservable('noResponse', () => this.nomenclatureService.getAllByType('no_response'));
      }

      const referenceData$ = forkJoin(observables).pipe(
        tap((data: ReferenceDataBundle) => {
          // Trier automatiquement les données
          this.sortReferenceData(data);
          this.loadingSubject.next(false);
        }),
        shareReplay(1), // Cache jusqu'au refresh de la page
        catchError(error => {
          this.loadingSubject.next(false);
          this.cache.delete(cacheKey);
          throw error;
        })
      );

      this.cache.set(cacheKey, referenceData$);
    }

    return this.cache.get(cacheKey)!;
  }

  /**
   * Récupère uniquement les données de base (sans sites, thèmes, etc.)
   */
  getBasicReferenceData(): Observable<Pick<ReferenceDataBundle, 'communes' | 'departements' | 'categories' | 'profils' | 'statuts'>> {
    return this.getReferenceData({ 
      includeSites: false, 
      includeThemes: false,
      includeEtats: false,
      includeNoResponse: false,
      includeHabitats: false
    }).pipe(
      map(data => ({
        communes: data.communes,
        departements: data.departements,
        categories: data.categories,
        profils: data.profils,
        statuts: data.statuts
      }))
    );
  }

  /**
   * Récupère les données pour les formulaires d'acteurs
   */
  getActorFormData(): Observable<Pick<ReferenceDataBundle, 'communes' | 'profils' | 'categories'>> {
    return this.getReferenceData().pipe(
      map(data => ({
        communes: data.communes,
        profils: data.profils,
        categories: data.categories
      }))
    );
  }

  /**
   * Récupère les données pour les formulaires de sites
   */
  getSiteFormData(): Observable<Pick<ReferenceDataBundle, 'habitats' | 'statuts' | 'departements'>> {
    return this.getReferenceData({ includeHabitats: true }).pipe(
      map(data => ({
        habitats: data.habitats || [],
        statuts: data.statuts,
        departements: data.departements
      }))
    );
  }

  /**
   * Récupère les données pour les composants de choix d'acteurs
   */
  getChoiceActorsData(): Observable<Pick<ReferenceDataBundle, 'departements' | 'categories'>> {
    return this.getReferenceData().pipe(
      map(data => ({
        departements: data.departements,
        categories: data.categories
      }))
    );
  }

  /**
   * Vide le cache (utile lors de la déconnexion ou refresh explicite)
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Vide un élément spécifique du cache
   */
  clearCacheItem(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Récupère un observable avec cache individuel
   */
  private getCachedObservable<T>(key: string, factory: () => Observable<T>): Observable<T> {
    if (!this.cache.has(key)) {
      const observable$ = factory().pipe(
        shareReplay(1),
        catchError(error => {
          this.cache.delete(key);
          throw error;
        })
      );
      this.cache.set(key, observable$);
    }
    return this.cache.get(key)!;
  }

  /**
   * Génère une clé de cache basée sur les options
   */
  private getCacheKey(options: LoadReferenceDataOptions): string {
    const keys = [];
    if (options.includeSites) keys.push('sites');
    if (options.includeThemes) keys.push('themes');
    if (options.includeEtats) keys.push('etats');
    if (options.includeNoResponse) keys.push('noResponse');
    if (options.includeHabitats !== false) keys.push('habitats');
    return `reference-data-${keys.join('-')}`;
  }

  /**
   * Trie automatiquement les données de référence
   */
  private sortReferenceData(data: ReferenceDataBundle): void {
    if (data.communes) {
      this.communeService.sortByName(data.communes);
    }
    if (data.departements) {
      this.departementService.sortByName(data.departements);
    }
    if (data.regions) {
      this.regionService.sortByName(data.regions);
    }
    if (data.categories) {
      this.nomenclatureService.sortByName(data.categories);
    }
    if (data.profils) {
      this.nomenclatureService.sortByName(data.profils);
    }
    if (data.statuts) {
      this.nomenclatureService.sortByName(data.statuts);
    }
    if (data.habitats) {
      this.nomenclatureService.sortByName(data.habitats);
    }
  }
}