import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpParams,
} from '@angular/common/http';
import { AppConfig } from '../../../conf/app.config';
import { Observable } from 'rxjs';


@Injectable()
export class DataFormService {
  constructor(private _http: HttpClient) { }


  getModulesList(exclude: Array<string> = []): Observable<Array<any>> {
    let queryString: HttpParams = new HttpParams();
    exclude.forEach(mod_code => {
      queryString = queryString.append('exclude', mod_code);
    });
    return this._http.get<Array<any>>(`${AppConfig.API_ENDPOINT}/gn_commons/modules`, {
      params: queryString
    });
  }

  //liste des lieux
  getPlaces() {
    return this._http.get<any>(`${AppConfig.API_ENDPOINT}/gn_commons/places`);
  }
  //Ajouter lieu
  addPlace(place: any) {
    return this._http.post<any>(`${AppConfig.API_ENDPOINT}/gn_commons/places`, place);
  }
  // Supprimer lieu
  deletePlace(idPlace: any) {
    return this._http.delete<any>(`${AppConfig.API_ENDPOINT}/gn_commons/places/${idPlace}`);
  }
}

