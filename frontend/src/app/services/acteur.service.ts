import { Observable, map } from 'rxjs';
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Acteur } from '@app/models/acteur.model';
import { IActeur } from '@app/interfaces/acteur.interface';
import { environment } from 'src/environments/environment';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class ActeurService {

  private GET_ALL_URL = environment.flask_server+'acteurs';
  private BASE_URL = environment.flask_server+'acteur/';
  private http = inject(HttpClient);
  private router = inject(Router);

  labels = {
    diagnosticsList:"Liste diagnostics",
    identity:"Identité",
    region:"Région",
    department:"Département",
    category:"Catégories",
    status:"Statut",
    structure:"Structure",
    profile:"Profil cognitif",
    telephone:"Téléphone",
    mail:"Mail",
    town:"Commune",
    state:'Etat'
  };

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

  get(id: number): Observable<Acteur> {
    return this.http.get<IActeur>(this.BASE_URL + id).pipe(
      map(acteurJson => Acteur.fromJson(acteurJson))
    );
  }

  add(acteur: Acteur): Observable<Acteur> {
    return this.http.post<IActeur>(this.BASE_URL, acteur.toJson()).pipe(
      map(acteurJson => Acteur.fromJson(acteurJson))
    );
  }

  update(acteur: Acteur): Observable<Acteur> {
    const route = this.BASE_URL + acteur.id_acteur;
    console.log(route);
    return this.http.put<IActeur>(route, acteur.toJson()).pipe(
      map(acteurJson => Acteur.fromJson(acteurJson))
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(this.BASE_URL + id + '/');
  }

  sortByName(objArray:Acteur[]){
    objArray.sort(function(a, b) {
      var textA = a.nom.toUpperCase();
      var textB = b.nom.toUpperCase();
      return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
    })
  }


}