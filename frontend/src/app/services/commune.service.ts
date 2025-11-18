import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/internal/Observable';
import { Commune } from '@app/models/commune.model';


@Injectable({
  providedIn: 'root'
})
export class CommuneService {
    
  private http = inject(HttpClient);

  getAll(): Observable<Commune[]> {
    return this.http.get<Commune[]>('assets/json/t_communes_202511121048.json');
  }
  
}
