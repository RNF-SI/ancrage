import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { IDiagnostic } from '@app/interfaces/diagnostic.interface';
import { IGraphMoy } from '@app/interfaces/graph-moy.interface';
import { IGraphRadar } from '@app/interfaces/graphradar.interface';
import { IGraphRepartition } from '@app/interfaces/igraph-repartition';
import { Diagnostic } from '@app/models/diagnostic.model';
import { GraphMoy } from '@app/models/graph-moy.model';
import { GraphRadar } from '@app/models/graph-radar.model';
import { GraphRepartition } from '@app/models/graph-repartition.model';
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

    getRadars(id_diagnostic:number): Observable<GraphRadar[]>{
      return this.http.get<IGraphRadar[]>(this.GET_ALL_URL+"/charts/radars/"+id_diagnostic).pipe(
        map(graphiquesJsonArray => {
          return graphiquesJsonArray.map<GraphRadar>(
            graphJson => GraphRadar.fromJson(graphJson)
          )
        })
      );
    }

    getStructures(id: number): Observable<any> {
      return this.http.get<any>(this.BASE_URL + '/structures/' + id ).pipe();
    }

    get(id: number,slug:string): Observable<Diagnostic> {
      return this.http.get<IDiagnostic>(this.BASE_URL + '/' + id + '/' + slug ).pipe(
        map(diagnosticJson => Diagnostic.fromJson(diagnosticJson))
      );
    }
  
    add(diagnostic: Diagnostic): Observable<Diagnostic> {
      return this.http.post<IDiagnostic>(this.BASE_URL, diagnostic.toJson()).pipe(
        map(diagnosticJson => Diagnostic.fromJson(diagnosticJson))
      );
    }
  
    update(diagnostic: Diagnostic): Observable<Diagnostic> {
      return this.http.put<IDiagnostic>(this.BASE_URL + '/' + diagnostic.id_diagnostic + '/' + diagnostic.slug, diagnostic.toJson()).pipe(
        map(diagnosticJson => Diagnostic.fromJson(diagnosticJson))
      );
    }
  
    delete(id: number): Observable<void> {
      return this.http.delete<void>(this.BASE_URL + id);
    }
    
}
