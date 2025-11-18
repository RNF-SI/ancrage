import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

import { Diagnostic } from '@app/models/diagnostic.model';
import { StateService } from './state.service';

/**
 * Service de navigation intelligent qui gère les redirections
 * avec conservation de l'état entre les pages.
 * 
 * Remplace les appels directs router.navigate avec localStorage
 * par une approche centralisée et typée.
 */
@Injectable({
  providedIn: 'root'
})
export class NavigationService {

  constructor(
    private router: Router,
    private stateService: StateService
  ) {}

  /**
   * Navigue vers la création/modification d'un acteur
   */
  navigateToActor(actorId?: number, slug?: string, diagnostic?: Diagnostic): void {
    if (diagnostic) {
      this.stateService.setDiagnostic(diagnostic);
    }
    this.stateService.setPreviousPage(this.router.url);

    if (actorId && slug) {
      this.router.navigate(['/acteur', actorId, slug,'update']);
    } else {
      this.router.navigate(['/acteur/create']);
    }
  }

  /**
   * Navigue vers la création/modification d'un site
   */
  navigateToSite(siteId?: number, slug?: string, diagnostic?: Diagnostic): void {
    if (diagnostic) {
      this.stateService.setDiagnostic(diagnostic);
    }
    this.stateService.setPreviousPage(this.router.url);

    if (siteId && slug) {
      this.router.navigate(['/site', siteId, slug,'update']);
    } else {
      this.router.navigate(['/site/create']);
    }
  }

  /**
   * Navigue vers un diagnostic
   */
  navigateToDiagnostic(diagnosticId?: number, slug?: string): void {
    this.stateService.setPreviousPage(this.router.url);

    if (diagnosticId && slug) {
      this.router.navigate(['/diagnostic', diagnosticId, slug,'update']);
    } else {
      this.router.navigate(['/diagnostic/create']);
    }
  }

  /**
   * Navigue vers la visualisation d'un diagnostic
   */
  navigateToDiagnosticView(diagnosticId: number, slug: string): void {
    this.stateService.setPageDiagnostic(this.router.url);
    this.router.navigate(['/diagnostic-visualisation', diagnosticId, slug]);
  }

  /**
   * Navigue vers l'entretien d'un acteur
   */
  navigateToEntretien(actorId: number, slug: string): void {
    this.stateService.setPreviousPage(this.router.url);
    this.router.navigate(['/entretien', actorId, slug]);
  }

  /**
   * Retourne à la page précédente si elle existe, sinon va à la page par défaut
   */
  goBack(defaultRoute: string[] = ['/diagnostics']): void {
    const previousPage = this.stateService.getCurrentPreviousPage();
    
    if (previousPage && previousPage !== this.router.url) {
      this.router.navigateByUrl(previousPage);
    } else {
      this.router.navigate(defaultRoute);
    }
  }

  /**
   * Retourne à la page de diagnostic si elle existe
   */
  goBackToDiagnostic(): void {
    const pageDiagnostic = this.stateService.getCurrentPageDiagnostic();
    
    if (pageDiagnostic) {
      this.router.navigateByUrl(pageDiagnostic);
    } else {
      this.router.navigate(['/diagnostics']);
    }
  }

  /**
   * Navigue vers la liste des diagnostics en nettoyant l'état
   */
  navigateToDiagnosticsList(clearState: boolean = true): void {
    if (clearState) {
      this.stateService.clearAll();
    }
    this.router.navigate(['/diagnostics']);
  }

  /**
   * Navigation avec cache automatique du diagnostic depuis un FormGroup
   */
  navigateWithFormCache(path: string[], formValue: any): void {
    // Créer un diagnostic temporaire depuis les données du formulaire
    const diagnostic = Object.assign(new Diagnostic(), formValue);
    this.stateService.setDiagnostic(diagnostic);
    this.stateService.setPreviousPage(this.router.url);
    this.router.navigate(path);
  }

  /**
   * Navigue vers une route en préservant le diagnostic actuel
   */
  navigatePreservingDiagnostic(path: string[]): void {
    this.stateService.setPreviousPage(this.router.url);
    this.router.navigate(path);
  }

  /**
   * Utilitaire pour vérifier si on peut revenir en arrière
   */
  canGoBack(): boolean {
    return !!this.stateService.getCurrentPreviousPage();
  }

  /**
   * Utilitaire pour obtenir l'URL de la page précédente
   */
  getPreviousPageUrl(): string {
    return this.stateService.getCurrentPreviousPage();
  }
}