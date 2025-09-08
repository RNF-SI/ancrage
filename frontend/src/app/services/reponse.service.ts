import { Observable, map } from 'rxjs';
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Reponse } from '@app/models/reponse.model';
import { environment } from 'src/environments/environment';
import { MotCle } from '@app/models/mot-cle.model';
import { IMotCle } from '@app/interfaces/mot_cle.interface';
import { IReponse } from '@app/interfaces/reponse.interface';


@Injectable({
  providedIn: 'root'
})
export class ReponseService {

  private BASE_URL = environment.flask_server+'reponse';
  private http = inject(HttpClient);

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