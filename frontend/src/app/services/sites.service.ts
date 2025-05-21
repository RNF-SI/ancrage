import { Observable, map } from 'rxjs';
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Site } from '@app/models/site.model';
import { ISite } from '@app/interfaces/site.interface';
import { environment } from 'src/environments/environment';
import { Router } from '@angular/router';
import { Diagnostic } from '@app/models/diagnostic.model';
import { DiagnosticStoreService } from './diagnostic-store.service';
import { DiagnosticCacheService } from './diagnostic-cache-service.service';
import { ActeurLight } from '@app/interfaces/acteur-light';
import { DiagnosticLight } from '@app/interfaces/diagnostic-light';
@Injectable({
	providedIn: 'root'
})

export class SiteService {

	private GET_ALL_URL = environment.flask_server+'sites';
	private BASE_URL = environment.flask_server+'site/';
	private http = inject(HttpClient);
	private router = inject(Router);
	private diagnosticStoreService = inject(DiagnosticStoreService);
	private diagnosticCacheService = inject(DiagnosticCacheService);

	getAll(): Observable<Site[]> {
		return this.http.get<ISite[]>(this.GET_ALL_URL).pipe(
			map(siteJsonArray => {
				return siteJsonArray.map<Site>(
					siteJson => Site.fromJson(siteJson)
				)
			})
		);
	}

	getAllByUser(user_id:number): Observable<Site[]> {
		return this.http.get<ISite[]>(this.GET_ALL_URL+'/'+user_id).pipe(
			map(siteJsonArray => {
				return siteJsonArray.map<Site>(
					siteJson => Site.fromJson(siteJson)
				)
			})
		);
	}

	get(id: number): Observable<Site> {
		return this.http.get<ISite>(this.BASE_URL + id).pipe(
			map(siteJson => Site.fromJson(siteJson))
		);
	}

	add(site: Site): Observable<Site> {
		return this.http.post<ISite>(this.BASE_URL, site.toJson()).pipe(
			map(siteJson => Site.fromJson(siteJson))
		);
	}

	update(site: Site): Observable<Site> {
		const route = this.BASE_URL + site.id_site;
		return this.http.put<ISite>(route, site.toJson()).pipe(
			map(siteJson => Site.fromJson(siteJson))
		);
	}

	sortByName(objArray:Site[]){
		objArray.sort(function(a, b) {
		  var textA = a.nom.toUpperCase();
		  var textB = b.nom.toUpperCase();
		  return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
		})
	}

	navigateAndReload(path: string,diagnostic: Diagnostic,site?: Site) {
		// Ajouter le site si non déjà présent
		if (site && !diagnostic.sites.some(s => s.id_site === site.id_site)) {
		  diagnostic.sites.push(site);
		}
		for(let i = 0;i<diagnostic.acteurs.length;i++){
			diagnostic.acteurs[i].reponses = [];
			
		}
		// Sauvegarde en cache Dexie
		localStorage.setItem("diagnostic",JSON.stringify(diagnostic));
	  
		// Mémorise l'URL précédente si besoin
		localStorage.setItem("previousPage", this.router.url);
	  
		// Navigue avec le cacheId comme paramètre de route
		this.router.navigate([path]);
	}

	sanitizeDiagnosticForLocalStorage(diagnostic: Diagnostic): DiagnosticLight {
		return {
			id_diagnostic: diagnostic.id_diagnostic,
			nom: diagnostic.nom,
			date_debut: diagnostic.date_debut,
			date_fin: diagnostic.date_fin,
			date_rapport: diagnostic.date_rapport,
			identite_createur: diagnostic.identite_createur,
			id_organisme: diagnostic.id_organisme,
			created_by: diagnostic.created_by,
			created_at: diagnostic.created_at,
			modified_at: diagnostic.modified_at,
			is_read_only: diagnostic.is_read_only,
			sites: diagnostic.sites,
			acteurs: diagnostic.acteurs.map(acteur => ({
				id_acteur: acteur.id_acteur,
				nom: acteur.nom,
				prenom: acteur.prenom,
				fonction: acteur.fonction,
				structure: acteur.structure,
				mail: acteur.mail,
				telephone: acteur.telephone,
				is_acteur_economique: acteur.is_acteur_economique,
				commune: acteur.commune,
				diagnostic: acteur.diagnostic,
				categories: acteur.categories
			}))
		};
}

}