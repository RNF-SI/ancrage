import { Observable, map } from 'rxjs';
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Reponse } from '@app/models/reponse.model';
import { environment } from 'src/environments/environment';
import { Nomenclature } from '@app/models/nomenclature.model';
import { INomenclature } from '@app/interfaces/nomenclature.interface';

@Injectable({
  providedIn: 'root'
})
export class ReponseService {

  private GET_ALL_URL = environment.flask_server+'reponses';
  private http = inject(HttpClient);

  //Enregistre la réponse
  update(array:Reponse[]): Observable<Nomenclature[]> {
       return this.http.post<INomenclature[]>(this.GET_ALL_URL+'/objets',array).pipe(
                 map(nomenclatureJsonArray => {
                   return nomenclatureJsonArray.map<Nomenclature>(
                     nomenclatureJson => Nomenclature.fromJson(nomenclatureJson)
                   )
                 })
               );
  }


}