import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { INomenclature } from '@app/interfaces/nomenclature.interface';
import { Nomenclature } from '@app/models/nomenclature.model';
import { Observable, map } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class NomenclatureService {

    private GET_ALL_URL = environment.flask_server+'nomenclatures';
    private BASE_URL = environment.flask_server+'nomenclature/';
    private http = inject(HttpClient);
    
  
    getAll(): Observable<Nomenclature[]> {
      return this.http.get<INomenclature[]>(this.GET_ALL_URL).pipe(
        map(nomenclatureJsonArray => {
          return nomenclatureJsonArray.map<Nomenclature>(
            nomenclatureJson => Nomenclature.fromJson(nomenclatureJson)
          )
        })
      );
    }
  
    getAllByUser(user_id:number): Observable<Nomenclature[]> {
      return this.http.get<INomenclature[]>(this.GET_ALL_URL+'/'+user_id).pipe(
        map(nomenclatureJsonArray => {
          return nomenclatureJsonArray.map<Nomenclature>(
            nomenclatureJson => Nomenclature.fromJson(nomenclatureJson)
          )
        })
      );
    }
  
    get(id: number): Observable<Nomenclature> {
      return this.http.get<INomenclature>(this.BASE_URL + id + '/').pipe(
        map(nomenclatureJson => Nomenclature.fromJson(nomenclatureJson))
      );
    }
  
    add(nomenclature: Nomenclature): Observable<Nomenclature> {
      return this.http.post<INomenclature>(this.BASE_URL, nomenclature.toJson()).pipe(
        map(nomenclatureJson => Nomenclature.fromJson(nomenclatureJson))
      );
    }
  
    update(nomenclature: Nomenclature): Observable<Nomenclature> {
      return this.http.put<INomenclature>(this.BASE_URL + nomenclature.id_nomenclature + '/', nomenclature.toJson()).pipe(
        map(nomenclatureJson => Nomenclature.fromJson(nomenclatureJson))
      );
    }
  
    delete(id: number): Observable<void> {
      return this.http.delete<void>(this.BASE_URL + id + '/');
    }
  
    
}
