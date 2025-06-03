import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { IMotCle } from '@app/interfaces/mot_cle.interface';
import { INomenclature } from '@app/interfaces/nomenclature.interface';
import { MotCle } from '@app/models/mot-cle.model';
import { Nomenclature } from '@app/models/nomenclature.model';
import { Observable, map } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class NomenclatureService {

    private BASE_URL = environment.flask_server+'nomenclature/';
    private GET_ALL_URL = environment.flask_server+'nomenclatures';
    private http = inject(HttpClient);
  
    //Récupère les nomenclatures par mnemonique
    getAllByType(mnemonique:string,id_acteur?:number): Observable<Nomenclature[]> {
      if (id_acteur){
        return this.http.get<INomenclature[]>(this.GET_ALL_URL+'/'+mnemonique + '/'+id_acteur).pipe(
          map(nomenclatureJsonArray => {
            return nomenclatureJsonArray.map<Nomenclature>(
              nomenclatureJson => Nomenclature.fromJson(nomenclatureJson)
            )
          })
        );
      }else{
        return this.http.get<INomenclature[]>(this.GET_ALL_URL+'/'+mnemonique).pipe(
          map(nomenclatureJsonArray => {
            return nomenclatureJsonArray.map<Nomenclature>(
              nomenclatureJson => Nomenclature.fromJson(nomenclatureJson)
            )
          })
        );
      }
     
    }

    //Récupère la nomenclature "Sans réponse"
    getNoResponse(valeur:string): Observable<Nomenclature> {
        valeur = "Sans%20réponse";
        return this.http.get<INomenclature>(this.BASE_URL + valeur).pipe(
          map(nomJson => Nomenclature.fromJson(nomJson))
        );
    }
  
    sortByName(objArray:Nomenclature[]){
        objArray.sort(function(a, b) {
          var textA = a.libelle.toUpperCase();
          var textB = b.libelle.toUpperCase();
          return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
        })
    }
    
}
