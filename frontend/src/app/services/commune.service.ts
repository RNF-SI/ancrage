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
    
    //Récupère toutes les communes
    getAll(): Observable<Commune[]> {
      return this.http.get<ICommune[]>(this.GET_ALL_URL).pipe(
        map(communeJsonArray => {
          return communeJsonArray.map<Commune>(
            communeJson => Commune.fromJson(communeJson)
          )
        })
      );
    }
  
    //Trie la liste par ordre alpha
    sortByName(objArray:Commune[]){
      objArray.sort(function(a, b) {
        var textA = a.nom_com.toUpperCase();
        var textB = b.nom_com.toUpperCase();
        return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
      })
    }
  
    
  }