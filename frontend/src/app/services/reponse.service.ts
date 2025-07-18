import { Observable, map } from 'rxjs';
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Reponse } from '@app/models/reponse.model';
import { environment } from 'src/environments/environment';
import { Nomenclature } from '@app/models/nomenclature.model';
import { INomenclature } from '@app/interfaces/nomenclature.interface';
import { MotCle } from '@app/models/mot-cle.model';
import { IMotCle } from '@app/interfaces/mot_cle.interface';
import { IReponse } from '@app/interfaces/reponse.interface';


@Injectable({
  providedIn: 'root'
})
export class ReponseService {

  private GET_ALL_URL = environment.flask_server+'reponses';
  private BASE_URL = environment.flask_server+'reponse';
  private http = inject(HttpClient);

  //Enregistre les réponses sauf afom
  updateAllButAfom(array:Reponse[]): Observable<Nomenclature[]> {
    return this.http.post<INomenclature[]>(this.GET_ALL_URL+'/objets',array).pipe(
      map(nomenclatureJsonArray => {
        return nomenclatureJsonArray.map<Nomenclature>(
          nomenclatureJson => Nomenclature.fromJson(nomenclatureJson)
        )
      })
    );
  }

  updateAfom(reponse:Reponse): Observable<MotCle[]> {
    return this.http.post<IMotCle[]>(this.BASE_URL+'/objet',reponse).pipe(
      map(kwJsonArray => {
        return kwJsonArray.map<MotCle>(
          kwJson => MotCle.fromJson(kwJson)
        )
      })
    );
  }

  update(reponse:Reponse): Observable<Reponse> {
    return this.http.post<IReponse>(this.BASE_URL,reponse).pipe(
      map(reponse => {
           return Reponse.fromJson(reponse);
      })
    );
  }

}