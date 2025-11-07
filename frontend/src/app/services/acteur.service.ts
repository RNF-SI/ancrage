import { Observable, map, shareReplay } from 'rxjs';
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
  private token = localStorage.getItem('tk_id_token');

  //Récupère les acteurs en fonction des sites
  getAllBySItes(json:any): Observable<Acteur[]> {
    return this.http.post<IActeur[]>(this.GET_ALL_URL+'/sites',json,{
      headers: { Authorization: `Bearer ${this.token}` }
    }).pipe(
      shareReplay(1),
      map(acteurJsonArray => {
        return acteurJsonArray.map<Acteur>(
          acteurJson => Acteur.fromJson(acteurJson)
        )
      })
    );
  }

  getAllByDiag(id_diagnostic:number): Observable<Acteur[]> {
    return this.http.get<IActeur[]>(this.GET_ALL_URL+'/diagnostic/'+id_diagnostic,{
      headers: { Authorization: `Bearer ${this.token}` }
    }).pipe(
      shareReplay(1),
      map(acteurJsonArray => {
        return acteurJsonArray.map<Acteur>(
          acteurJson => Acteur.fromJson(acteurJson)
        )
      })
    );
  }

  //Modifie l'état de l'entretien
  modifiyInterviewState(json:any,id_acteur: number,id_state:number): Observable<Acteur> {
    const route = this.BASE_URL + 'state/'+ id_acteur + '/' + id_state;
    return this.http.put<IActeur>(route, json,{
      headers: { Authorization: `Bearer ${this.token}` }
    }).pipe(
      map(acteurJson => Acteur.fromJson(acteurJson))
    );
  }

  //Récupère un acteur
  get(id: number,slug:string): Observable<Acteur> {
    return this.http.get<IActeur>(this.BASE_URL + id + '/'+ slug,{
      headers: { Authorization: `Bearer ${this.token}` }
    }).pipe(
      shareReplay(1),
      map(acteurJson => Acteur.fromJson(acteurJson))
    );
  }

  //Ajoute un acteur
  add(acteur: Acteur): Observable<Acteur> {
    return this.http.post<IActeur>(this.BASE_URL, acteur.toJson(),{
      headers: { Authorization: `Bearer ${this.token}` }
    }).pipe(
      map(acteurJson => Acteur.fromJson(acteurJson))
    );
  }

  //Met à jour un acteur
  update(acteur: Acteur): Observable<Acteur> {
    const route = this.BASE_URL + acteur.id_acteur + '/' + acteur.slug;
   
    return this.http.put<IActeur>(route, acteur.toJson(),{
      headers: { Authorization: `Bearer ${this.token}` }
    }).pipe(
      map(acteurJson => Acteur.fromJson(acteurJson))
    );
  }

  //Trie la liste par ordre alpha
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

  disableActor(actor:Acteur): Observable<Acteur> {
      return this.http.put<IActeur>(this.BASE_URL + 'disable/' + actor.id_acteur + '/' + actor.slug, actor.toJson(),{
        headers: { Authorization: `Bearer ${this.token}` }
      }).pipe(
        map(acteurJson => Acteur.fromJson(acteurJson))
      );
  }


}