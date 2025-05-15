import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { IDiagnostic } from '@app/interfaces/diagnostic.interface';
import { IGraphMoy } from '@app/interfaces/graph-moy.interface';
import { IGraphRepartition } from '@app/interfaces/igraph-repartition';
import { Diagnostic } from '@app/models/diagnostic.model';
import { GraphMoy } from '@app/models/graph-moy';
import { GraphRepartition } from '@app/models/graph-repartition';
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

    getAverageByQuestion(id_diagnostic:number): Observable<GraphMoy[]>{
      return this.http.get<IGraphMoy[]>(this.GET_ALL_URL+"/charts/average/"+id_diagnostic).pipe(
        map(graphiquesJsonArray => {
          return graphiquesJsonArray.map<GraphMoy>(
            graphJson => GraphMoy.fromJson(graphJson)
          )
        })
      );
    }

    getRepartition(id_diagnostic:number): Observable<GraphRepartition[]>{
      return this.http.get<IGraphRepartition[]>(this.GET_ALL_URL+"/charts/repartition/"+id_diagnostic).pipe(
        map(graphiquesJsonArray => {
          return graphiquesJsonArray.map<GraphRepartition>(
            graphJson => GraphRepartition.fromJson(graphJson)
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
