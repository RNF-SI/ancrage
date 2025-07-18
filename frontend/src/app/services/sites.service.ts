import { Observable, map, shareReplay } from 'rxjs';
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Site } from '@app/models/site.model';
import { ISite } from '@app/interfaces/site.interface';
import { environment } from 'src/environments/environment';
import { Router } from '@angular/router';
import { Diagnostic } from '@app/models/diagnostic.model';
import { StateService } from './state.service';

@Injectable({
	providedIn: 'root'
})

export class SiteService {

	private GET_ALL_URL = environment.flask_server+'sites';
	private BASE_URL = environment.flask_server+'site/';
	private http = inject(HttpClient);
	private router = inject(Router);
	private stateService = inject(StateService);
	
	//Récupère tous les sites
	getAll(): Observable<Site[]> {
		return this.http.get<ISite[]>(this.GET_ALL_URL).pipe(
			shareReplay(1),
			map(siteJsonArray => {
				return siteJsonArray.map<Site>(
					siteJson => Site.fromJson(siteJson)
				)
			})
		);
	}

	//Récupère tous les sites en fonction du créateur du diag
	getAllByUser(user_id:number): Observable<Site[]> {
		return this.http.get<ISite[]>(this.GET_ALL_URL+'/'+user_id).pipe(
			shareReplay(1),
			map(siteJsonArray => {
				return siteJsonArray.map<Site>(
					siteJson => Site.fromJson(siteJson)
				)
			})
		);
	}

	//Récupère un site
	get(id:number,slug: string): Observable<Site> {
		return this.http.get<ISite>(this.BASE_URL + id + '/' + slug).pipe(
			shareReplay(1),
			map(siteJson => Site.fromJson(siteJson))
		);
	}

	//Ajout
	add(site: Site): Observable<Site> {
		return this.http.post<ISite>(this.BASE_URL, site.toJson()).pipe(
			map(siteJson => Site.fromJson(siteJson))
		);
	}

	//Mise à jour
	update(site: Site): Observable<Site> {
		const route = this.BASE_URL + site.id_site + '/' + site.slug;
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

	navigateAndCache(path: string,diagnostic: Diagnostic,site?: Site,nocache?:boolean) {
		
		if (site && !diagnostic.sites.some(s => s.id_site === site.id_site)) {
		  diagnostic.sites.push(site);
		}
		for(let i = 0;i<diagnostic.acteurs.length;i++){
			diagnostic.acteurs[i].reponses = [];
			
		}
		this.stateService.clearDiagnostic();
		this.stateService.setDiagnostic(diagnostic);
		
		if (!nocache){
			this.stateService.setPreviousPage(this.router.url);
		}
	
		this.router.navigate([path]);
	}

}