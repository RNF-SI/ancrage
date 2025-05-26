import { Observable, map } from 'rxjs';
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Acteur } from '@app/models/acteur.model';
import { IActeur } from '@app/interfaces/acteur.interface';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ActeurService {

  private GET_ALL_URL = environment.flask_server+'acteurs';
  private BASE_URL = environment.flask_server+'acteur/';
  private http = inject(HttpClient);

  getAll(): Observable<Acteur[]> {
    return this.http.get<IActeur[]>(this.GET_ALL_URL).pipe(
      map(acteurJsonArray => {
        return acteurJsonArray.map<Acteur>(
          acteurJson => Acteur.fromJson(acteurJson)
        )
      })
    );
  }

  getAllByUser(user_id:number): Observable<Acteur[]> {
    return this.http.get<IActeur[]>(this.GET_ALL_URL+'/'+user_id).pipe(
      map(acteurJsonArray => {
        return acteurJsonArray.map<Acteur>(
          acteurJson => Acteur.fromJson(acteurJson)
        )
      })
    );
  }

  modifiyInterviewState(json:any,id_acteur: number,id_state:number): Observable<Acteur> {
    const route = this.BASE_URL + 'state/'+ id_acteur + '/' + id_state;
    return this.http.put<IActeur>(route, json).pipe(
      map(acteurJson => Acteur.fromJson(acteurJson))
    );
  }

  get(id: number,slug:string): Observable<Acteur> {
    return this.http.get<IActeur>(this.BASE_URL + id + '/'+ slug).pipe(
      map(acteurJson => Acteur.fromJson(acteurJson))
    );
  }

  add(acteur: Acteur): Observable<Acteur> {
    return this.http.post<IActeur>(this.BASE_URL, acteur.toJson()).pipe(
      map(acteurJson => Acteur.fromJson(acteurJson))
    );
  }

  update(acteur: Acteur): Observable<Acteur> {
    const route = this.BASE_URL + acteur.id_acteur + '/' + acteur.slug;
   
    return this.http.put<IActeur>(route, acteur.toJson()).pipe(
      map(acteurJson => Acteur.fromJson(acteurJson))
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(this.BASE_URL + id + '/');
  }

  sortByNameAndSelected(objArray:Acteur[]){
    objArray.sort((a, b) => {
      
      if (a.selected !== b.selected) {
        return a.selected ? -1 : 1;
      }
      
      const textA = a.nom.toUpperCase();
      const textB = b.nom.toUpperCase();
      return textA.localeCompare(textB);
    });
  }


}