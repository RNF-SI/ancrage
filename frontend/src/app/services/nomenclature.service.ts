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
    private http = inject(HttpClient);
  
    getAllByType(mnemonique:string): Observable<Nomenclature[]> {
      return this.http.get<INomenclature[]>(this.GET_ALL_URL+'/'+mnemonique).pipe(
        map(nomenclatureJsonArray => {
          return nomenclatureJsonArray.map<Nomenclature>(
            nomenclatureJson => Nomenclature.fromJson(nomenclatureJson)
          )
        })
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
