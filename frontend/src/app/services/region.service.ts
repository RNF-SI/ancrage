import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { IRegion } from '@app/interfaces/region.interface';
import { Region } from '@app/models/region.model';
import { Observable, map } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RegionService {

  private GET_ALL_URL = environment.flask_server+'regions';
  private BASE_URL = environment.flask_server+'region/';
  private http = inject(HttpClient);
  

  getAll(): Observable<Region[]> {
    return this.http.get<IRegion[]>(this.GET_ALL_URL).pipe(
      map(regionJsonArray => {
        return regionJsonArray.map<Region>(
          regionJson => Region.fromJson(regionJson)
        )
      })
    );
  }

  getAllByUser(user_id:number): Observable<Region[]> {
    return this.http.get<IRegion[]>(this.GET_ALL_URL+'/'+user_id).pipe(
      map(regionJsonArray => {
        return regionJsonArray.map<Region>(
          regionJson => Region.fromJson(regionJson)
        )
      })
    );
  }

  get(id: number): Observable<Region> {
    return this.http.get<IRegion>(this.BASE_URL + id).pipe(
      map(regionJson => Region.fromJson(regionJson))
    );
  }

  add(region: Region): Observable<Region> {
    return this.http.post<IRegion>(this.BASE_URL, region.toJson()).pipe(
      map(regionJson => Region.fromJson(regionJson))
    );
  }

  update(region: Region): Observable<Region> {
    return this.http.put<IRegion>(this.BASE_URL + region.id_region + '/', region.toJson()).pipe(
      map(regionJson => Region.fromJson(regionJson))
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(this.BASE_URL + id + '/');
  }

  sortByName(objArray:Region[]){
    objArray.sort(function(a, b) {
      var textA = a.nom_reg.toUpperCase();
      var textB = b.nom_reg.toUpperCase();
      return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
    })
  }

}
