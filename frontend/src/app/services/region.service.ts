import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { IRegion } from '@app/interfaces/region.interface';
import { Region } from '@app/models/region.model';
import { Observable, map } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RegionService {

  private GET_ALL_URL = environment.flask_server+'regions';
  private http = inject(HttpClient);
  

  getAll(): Observable<Region[]> {
    return this.http.get<IRegion[]>(this.GET_ALL_URL).pipe(
      map(regionJsonArray => {
        return regionJsonArray.map<Region>(
          regionJson => Region.fromJson(regionJson)
        )
      })
    );
  }

  sortByName(objArray:Region[]){
    objArray.sort(function(a, b) {
      var textA = a.nom_reg.toUpperCase();
      var textB = b.nom_reg.toUpperCase();
      return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
    })
  }

}
