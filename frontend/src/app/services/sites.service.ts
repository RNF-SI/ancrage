import { Observable, map } from 'rxjs';
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Site } from '@app/models/site.model';
import { ISite } from '@app/interfaces/site.interface';
import { environment } from 'src/environments/environment';
import { Router } from '@angular/router';
import { Diagnostic } from '@app/models/diagnostic.model';
@Injectable({
	providedIn: 'root'
})
export class SiteService {

	private GET_ALL_URL = environment.flask_server+'sites';
	private BASE_URL = environment.flask_server+'site/';
	private http = inject(HttpClient);
	private router = inject(Router);

	labels = {
		  departementLabel: "Départements",
		  housingLabel: "Habitats",
		  statusLabel:"Statut",
		  nameLabel: "Nom",
		  latitudeLabel: "Latitude",
		  longitudeLabel: "Longitude",
		  btnRecordLabel: "Enregistrer",
		  btnPreviousStepLabel: "Revenir à l'étape précédente",
		  regionLabel: "Régions"
	}

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
		console.log(route);
		return this.http.put<ISite>(route, site.toJson()).pipe(
			map(siteJson => Site.fromJson(siteJson))
		);
	}

	delete(id: number): Observable<void> {
		return this.http.delete<void>(this.BASE_URL + id + '/');
	}

	sortByName(objArray:Site[]){
		objArray.sort(function(a, b) {
		  var textA = a.nom.toUpperCase();
		  var textB = b.nom.toUpperCase();
		  return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
		})
	}

	navigateAndReload(path: string,diagnostic:Diagnostic,site?:Site) {
		if (site){
			diagnostic.sites.push(site);
		}
		
		localStorage.setItem("diagnostic",JSON.stringify(diagnostic));
		console.log(localStorage.getItem("diagnostic"));
		this.router.navigate([path]).then(() => {
		  window.location.reload();
		});;
	}

}