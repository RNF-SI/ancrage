import { Observable, map } from 'rxjs';
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Site } from '@app/models/site.model';
import { ISite } from '@app/interfaces/site.interface';

@Injectable({
	providedIn: 'root'
})
export class SiteService {

	private GET_ALL_URL = 'http://localhost:5000/sites';
	private BASE_URL = 'http://localhost:5000/site/';
	private http = inject(HttpClient);

	getAll(): Observable<Site[]> {
		return this.http.get<ISite[]>(this.GET_ALL_URL).pipe(
			map(siteJsonArray => {
				return siteJsonArray.map<Site>(
					siteJson => Site.fromJson(siteJson)
				)
			})
		);
	}

	get(id: number): Observable<Site> {
		return this.http.get<ISite>(this.BASE_URL + id + '/').pipe(
			map(siteJson => Site.fromJson(siteJson))
		);
	}

	add(site: Site): Observable<Site> {
		return this.http.post<ISite>(this.BASE_URL, site.toJson()).pipe(
			map(siteJson => Site.fromJson(siteJson))
		);
	}

	update(site: Site): Observable<Site> {
		return this.http.put<ISite>(this.BASE_URL + site.id_site + '/', site.toJson()).pipe(
			map(siteJson => Site.fromJson(siteJson))
		);
	}

	delete(id: number): Observable<void> {
		return this.http.delete<void>(this.BASE_URL + id + '/');
	}

}