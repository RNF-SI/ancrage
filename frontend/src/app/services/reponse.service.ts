import { Observable, map } from 'rxjs';
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Reponse } from '@app/models/reponse.model';
import { environment } from 'src/environments/environment';
import { Acteur } from '@app/models/acteur.model';

@Injectable({
  providedIn: 'root'
})
export class ReponseService {

  private GET_ALL_URL = environment.flask_server+'reponses';
  private http = inject(HttpClient);


  update(array:Reponse[]): Observable<Acteur> {
       return this.http.post<Acteur>(this.GET_ALL_URL+"/objets",array).pipe(
        map(acteurJson => Acteur.fromJson(acteurJson))
       );
  }


}