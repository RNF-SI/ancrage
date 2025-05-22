import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ICommune } from '@app/interfaces/commune.interface';
import { Commune } from '@app/models/commune.model';
import { Observable, map } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CommuneService {

    private GET_ALL_URL = environment.flask_server+'communes';
    private BASE_URL = environment.flask_server+'commune/';
    private http = inject(HttpClient);
    
  
    getAll(): Observable<Commune[]> {
      return this.http.get<ICommune[]>(this.GET_ALL_URL).pipe(
        map(communeJsonArray => {
          return communeJsonArray.map<Commune>(
            communeJson => Commune.fromJson(communeJson)
          )
        })
      );
    }
  
    get(id: number): Observable<Commune> {
      return this.http.get<ICommune>(this.BASE_URL + id).pipe(
        map(communeJson => Commune.fromJson(communeJson))
      );
    }
  
    add(commune: Commune): Observable<Commune> {
      return this.http.post<ICommune>(this.BASE_URL, commune.toJson()).pipe(
        map(communeJson => Commune.fromJson(communeJson))
      );
    }
  
    update(commune: Commune): Observable<Commune> {
      const route = this.BASE_URL + commune.id_commune;
      
      return this.http.put<ICommune>(route, commune.toJson()).pipe(
        map(communeJson => Commune.fromJson(communeJson))
      );
    }
  
    delete(id: number): Observable<void> {
      return this.http.delete<void>(this.BASE_URL + id + '/');
    }
  
    sortByName(objArray:Commune[]){
      objArray.sort(function(a, b) {
        var textA = a.nom_com.toUpperCase();
        var textB = b.nom_com.toUpperCase();
        return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
      })
    }
  
    
  }