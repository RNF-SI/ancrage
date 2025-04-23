import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { IDepartement } from '@app/interfaces/departement.interface';
import { Departement } from '@app/models/departement.model';
import { Observable, map } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DepartementService {

  private GET_ALL_URL = environment.flask_server+'departements';
  private BASE_URL = environment.flask_server+'departement/';
  private http = inject(HttpClient);
  

  getAll(): Observable<Departement[]> {
    return this.http.get<IDepartement[]>(this.GET_ALL_URL).pipe(
      map(departementJsonArray => {
        return departementJsonArray.map<Departement>(
          departementJson => Departement.fromJson(departementJson)
        )
      })
    );
  }

  sortByName(objArray:Departement[]){
    objArray.sort(function(a, b) {
      var textA = a.nom_dep.toUpperCase();
      var textB = b.nom_dep.toUpperCase();
      return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
    })
  }

}
