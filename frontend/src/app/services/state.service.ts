import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Diagnostic } from '@app/models/diagnostic.model';
import { Router } from '@angular/router';
import { Acteur } from '@app/models/acteur.model';

/**
 * Service hybride pour la gestion d'état temporaire avec persistance localStorage
 * Remplace l'usage direct et non-sécurisé du localStorage dans les composants
 * 
 * Fonctionnalités :
 * - État réactif avec BehaviorSubject
 * - Persistance automatique dans localStorage comme backup
 * - Gestion d'erreurs robuste
 * - Validation des données
 * - Synchronisation automatique entre composants
 */
@Injectable({
    providedIn: 'root'
})
export class StateService {

    // Clés localStorage
    private readonly DIAGNOSTIC_KEY = 'diagnostic';
    private readonly PREVIOUS_PAGE_KEY = 'previousPage';
    private readonly PAGE_DIAGNOSTIC_KEY = 'pageDiagnostic';
    private readonly FROM_ACTOR_PAGE_KEY = "fromActor";
    private readonly PAGE_DIAGNOSTIC_CREATION_KEY = "pageDiagCreation";
    private readonly ACTOR_KEY = "acteur";

    // État réactif pour le diagnostic en cours de création/modification
    private diagnosticSubject = new BehaviorSubject<Diagnostic>(new Diagnostic());
    private previousPageSubject = new BehaviorSubject<string>('');
    private pageDiagnosticSubject = new BehaviorSubject<string>('');
    private pageFromActorSubject = new BehaviorSubject<string>('');
    private pageDiagCreationSubject = new BehaviorSubject<string>('');
    private actorSubject = new BehaviorSubject<Acteur>(new Acteur());

    // Observables publics
    public diagnostic$ = this.diagnosticSubject.asObservable();
    public previousPage$ = this.previousPageSubject.asObservable();
    public pageDiagnostic$ = this.pageDiagnosticSubject.asObservable();
    public pageFromActor$ = this.pageFromActorSubject.asObservable();
    public pageDiagCreation$ = this.pageDiagCreationSubject.asObservable();
    public actor$ = this.actorSubject.asObservable();

    constructor(private router: Router) {
        this.initializeFromStorage();
    }

    /**
     * Initialise l'état depuis localStorage au démarrage de l'application
     */
    private initializeFromStorage(): void {
        try {
            // Restaurer le diagnostic
            const diagnosticData = this.safeGetItem(this.DIAGNOSTIC_KEY);
            if (diagnosticData) {
                const diagnostic = this.validateAndCreateDiagnostic(diagnosticData);
                if (diagnostic) {
                    this.diagnosticSubject.next(diagnostic);
                }
            }

            // Restaurer les pages de navigation
            const previousPage = this.safeGetItem(this.PREVIOUS_PAGE_KEY);
            if (previousPage) {
                this.previousPageSubject.next(previousPage);
            }

            const pageDiagnostic = this.safeGetItem(this.PAGE_DIAGNOSTIC_KEY);
            if (pageDiagnostic) {
                this.pageDiagnosticSubject.next(pageDiagnostic);
            }

            const pageFromActor = this.safeGetItem(this.FROM_ACTOR_PAGE_KEY);
            if (pageFromActor) {
                this.pageFromActorSubject.next(pageFromActor);
            }

            const pageDiagCreation = this.safeGetItem(this.PAGE_DIAGNOSTIC_CREATION_KEY);
            if (pageDiagCreation) {
                this.pageDiagCreationSubject.next(pageDiagCreation);
            }

            const actor = this.safeGetItem(this.ACTOR_KEY);
            if (actor) {
                this.actorSubject.next(actor);
            }

        } catch (error) {
            console.warn('StateService: Erreur lors de l\'initialisation depuis localStorage', error);
            this.clearAll();
        }
    }

    /**
     * Définit le diagnostic actuel avec persistance automatique
     */
    setDiagnostic(diagnostic: Diagnostic): void {
        this.diagnosticSubject.next(diagnostic);

        if (diagnostic) {
            this.safeSetItem(this.DIAGNOSTIC_KEY, diagnostic);
        } else {
            this.safeRemoveItem(this.DIAGNOSTIC_KEY);
        }
    }

    /**
     * Récupère le diagnostic actuel (valeur synchrone)
     */
    getCurrentDiagnostic(): Diagnostic | null {
        return this.diagnosticSubject.value;
    }

    getCurrentActor(): Acteur {
        return this.actorSubject.value;
    }

    setActor(acteur: Acteur): void {
        this.actorSubject.next(acteur);
        if (acteur) {
            this.safeSetItem(this.ACTOR_KEY, acteur);
        } else {
            this.safeRemoveItem(this.ACTOR_KEY);
        }
    }

    /**
     * Met à jour des propriétés spécifiques du diagnostic
     */
    updateDiagnostic(updates: Partial<Diagnostic>): void {
        const current = this.getCurrentDiagnostic();
        if (current) {
            const updated = Object.assign(current, updates);
            this.setDiagnostic(updated);
        }
    }

    /**
     * Définit la page précédente pour la navigation
     */
    setPreviousPage(url: string): void {
        this.previousPageSubject.next(url);
        this.safeSetItem(this.PREVIOUS_PAGE_KEY, url);
    }

    /**
     * Récupère la page précédente
     */
    getCurrentPreviousPage(): string {
        return this.previousPageSubject.value;
    }

    
    setPageCreationDiag(url: string): void {
        this.pageDiagCreationSubject.next(url);
        this.safeSetItem(this.PAGE_DIAGNOSTIC_CREATION_KEY, url);
    }

    
    getCurrentPageCreationDiag(): string {
        return this.pageDiagCreationSubject.value;
    }

    /**
     * Définit la page de diagnostic actuelle
     */
    setPageDiagnostic(url: string): void {
        this.pageDiagnosticSubject.next(url);
        this.safeSetItem(this.PAGE_DIAGNOSTIC_KEY, url);
    }

    /**
     * Récupère la page de diagnostic
     */
    getCurrentPageDiagnostic(): string {
        return this.pageDiagnosticSubject.value;
    }

    setPageFromActor(url: string): void {
        this.pageFromActorSubject.next(url);
        this.safeSetItem(this.FROM_ACTOR_PAGE_KEY, url);
    }

   
    getCurrentPageFromActor(): string {
        return this.pageFromActorSubject.value;
    }

    /**
     * Navigation avec sauvegarde automatique de l'état
     */
    navigateWithState(path: string[], diagnostic: Diagnostic): void {
        // Sauvegarder la page actuelle comme précédente
        this.setPreviousPage(this.router.url);

        // Sauvegarder le diagnostic si fourni
        if (diagnostic) {
            this.setDiagnostic(diagnostic);
        }

        // Naviguer
        this.router.navigate(path);
    }

    /**
     * Navigue vers la page précédente si elle existe
     */
    navigateToPreviousPage(): void {
        const previousPage = this.getCurrentPreviousPage();
        if (previousPage) {
            this.router.navigateByUrl(previousPage);
        }
    }

    /**
     * Efface tout l'état temporaire (utile lors de la déconnexion ou fin de diagnostic)
     */
    clearAll(): void {
        this.diagnosticSubject.next(new Diagnostic());
        this.previousPageSubject.next('');
        this.pageDiagnosticSubject.next('');

        this.safeRemoveItem(this.DIAGNOSTIC_KEY);
        this.safeRemoveItem(this.PREVIOUS_PAGE_KEY);
        this.safeRemoveItem(this.PAGE_DIAGNOSTIC_KEY);
        this.safeRemoveItem(this.FROM_ACTOR_PAGE_KEY);
    }

    /**
     * Efface seulement le diagnostic (gardant la navigation)
     */
    clearDiagnostic(): void {
        this.setDiagnostic(new Diagnostic());
    }

    /**
     * Vérifie si un diagnostic est en cours
     */
    hasDiagnostic(): boolean {
        return this.getCurrentDiagnostic()!.id_diagnostic > 0;
    }

    // ===== MÉTHODES PRIVÉES DE SÉCURITÉ =====

    /**
     * Lecture sécurisée depuis localStorage
     */
    private safeGetItem(key: string): any {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (error) {
            console.warn(`StateService: Erreur lecture localStorage[${key}]`, error);
            // Nettoyer la donnée corrompue
            localStorage.removeItem(key);
            return null;
        }
    }

    /**
     * Écriture sécurisée dans localStorage
     */
    private safeSetItem(key: string, value: any): void {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error(`StateService: Erreur écriture localStorage[${key}]`, error);
            // Si l'espace est plein, essayer de nettoyer les anciennes données
            if (error instanceof DOMException && error.code === 22) {
                console.warn('StateService: Espace localStorage plein, nettoyage...');
                this.clearAll();
            }
        }
    }

    /**
     * Suppression sécurisée depuis localStorage
     */
    private safeRemoveItem(key: string): void {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.warn(`StateService: Erreur suppression localStorage[${key}]`, error);
        }
    }

    /**
     * Valide et crée un objet Diagnostic depuis les données localStorage
     */
    private validateAndCreateDiagnostic(data: any): Diagnostic | null {
        try {
            // Vérification basique de la structure
            if (!data || typeof data !== 'object') {
                return null;
            }

            // Créer un diagnostic avec les données validées
            const diagnostic = Object.assign(new Diagnostic(), data);

            // Validation minimale des propriétés critiques
            if (diagnostic.id_diagnostic === undefined) {
                diagnostic.id_diagnostic = data.id_diagnostic || 0;
            }

            if (!diagnostic.nom) {
                diagnostic.nom = data.nom || '';
            }

            // Assurer que les tableaux existent
            diagnostic.sites = Array.isArray(data.sites) ? data.sites : [];
            diagnostic.acteurs = Array.isArray(data.acteurs) ? data.acteurs : [];

            return diagnostic;
        } catch (error) {
            console.warn('StateService: Erreur validation diagnostic', error);
            return null;
        }
    }
}