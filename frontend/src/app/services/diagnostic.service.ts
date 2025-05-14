import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { IDiagnostic } from '@app/interfaces/diagnostic.interface';
import { IGraphMoy } from '@app/interfaces/graph-moy.interface';
import { Diagnostic } from '@app/models/diagnostic.model';
import { GraphMoy } from '@app/utils/graph-moy';
import { Observable, map } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DiagnosticService {

    private GET_ALL_URL = environment.flask_server+ 'diagnostics';
    private BASE_URL = environment.flask_server+ 'diagnostic';
    private http = inject(HttpClient);
    
  
    getAll(): Observable<Diagnostic[]> {
      return this.http.get<IDiagnostic[]>(this.GET_ALL_URL).pipe(
        map(diagnosticJsonArray => {
          return diagnosticJsonArray.map<Diagnostic>(
            diagnosticJson => Diagnostic.fromJson(diagnosticJson)
          )
        })
      );
    }
    getAllBySites(array:any): Observable<Diagnostic[]> {
      return this.http.post<IDiagnostic[]>(this.GET_ALL_URL+"-site",array).pipe(
        map(diagnosticJsonArray => {
          return diagnosticJsonArray.map<Diagnostic>(
            diagnosticJson => Diagnostic.fromJson(diagnosticJson)
          )
        })
      );
    }

    getAverageByQuestion(): Observable<GraphMoy[]>{
      return this.http.get<IGraphMoy[]>(this.GET_ALL_URL+"/charts/average").pipe(
        map(graphiquesJsonArray => {
          return graphiquesJsonArray.map<GraphMoy>(
            graphJson => GraphMoy.fromJson(graphJson)
          )
        })
      );
    }

    get(id: number): Observable<Diagnostic> {
      return this.http.get<IDiagnostic>(this.BASE_URL + '/' + id ).pipe(
        map(diagnosticJson => Diagnostic.fromJson(diagnosticJson))
      );
    }
  
    add(diagnostic: Diagnostic): Observable<Diagnostic> {
      return this.http.post<IDiagnostic>(this.BASE_URL, diagnostic.toJson()).pipe(
        map(diagnosticJson => Diagnostic.fromJson(diagnosticJson))
      );
    }
  
    update(diagnostic: Diagnostic): Observable<Diagnostic> {
      return this.http.put<IDiagnostic>(this.BASE_URL + '/' + diagnostic.id_diagnostic, diagnostic.toJson()).pipe(
        map(diagnosticJson => Diagnostic.fromJson(diagnosticJson))
      );
    }
  
    delete(id: number): Observable<void> {
      return this.http.delete<void>(this.BASE_URL + id);
    }
    
}
