import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { IActeur } from '@app/interfaces/acteur.interface';
import { IDiagnostic } from '@app/interfaces/diagnostic.interface';
import { IGraphMoy } from '@app/interfaces/graph-moy.interface';
import { IGraphRadar } from '@app/interfaces/graphradar.interface';
import { IGraphMotsCles } from '@app/interfaces/igraph-mots-cles';
import { IGraphRepartition } from '@app/interfaces/igraph-repartition';
import { Acteur } from '@app/models/acteur.model';
import { Diagnostic } from '@app/models/diagnostic.model';
import { Document } from '@app/models/document.model';
import { GraphMotsCles } from '@app/models/graph-mots-cles';
import { GraphMoy } from '@app/models/graph-moy.model';
import { GraphRadar } from '@app/models/graph-radar.model';
import { GraphRepartition } from '@app/models/graph-repartition.model';
import { Parameters } from '@app/models/parameters.model';
import { Observable, map, shareReplay } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DiagnosticService {

    private GET_ALL_URL = environment.flask_server+ 'diagnostics';
    private BASE_URL = environment.flask_server+ 'diagnostic';
    private http = inject(HttpClient);
    private token = localStorage.getItem('tk_id_token');
  
    //Récupère les diags en fonction des sites
    getAllBySites(array:any): Observable<Diagnostic[]> {
      return this.http.post<IDiagnostic[]>(this.GET_ALL_URL+"-site",array,{
        headers: { Authorization: `Bearer ${this.token}` }
      }).pipe(
        shareReplay(1),
        map(diagnosticJsonArray => {
          return diagnosticJsonArray.map<Diagnostic>(
            diagnosticJson => Diagnostic.fromJson(diagnosticJson)
          )
        })
      );
    }

    //Récupère les données des histogrammes
    getAverageByQuestion(id_diagnostic:number): Observable<GraphMoy[]>{
      return this.http.get<IGraphMoy[]>(this.GET_ALL_URL+"/charts/average/"+id_diagnostic,{
        headers: { Authorization: `Bearer ${this.token}` }
      }).pipe(
        shareReplay(1),
        map(graphiquesJsonArray => {
          return graphiquesJsonArray.map<GraphMoy>(
            graphJson => GraphMoy.fromJson(graphJson)
          )
        })
      );
    }

    getAverageByQuestionParams(params:Parameters): Observable<GraphMoy[]>{
      return this.http.put<IGraphMoy[]>(this.BASE_URL+"/params/charts/average",params.toJson(),{
        headers: { Authorization: `Bearer ${this.token}` }
      }).pipe(
        shareReplay(1),
        map(graphiquesJsonArray => {
          return graphiquesJsonArray.map<GraphMoy>(
            graphJson => GraphMoy.fromJson(graphJson)
          )
        })
      );
    }

    //Récupère les données des camemberts
    getRepartition(id_diagnostic:number): Observable<GraphRepartition[]>{
      return this.http.get<IGraphRepartition[]>(this.GET_ALL_URL+"/charts/repartition/"+id_diagnostic,{
        headers: { Authorization: `Bearer ${this.token}` }
      }).pipe(
        shareReplay(1),
        map(graphiquesJsonArray => {
          return graphiquesJsonArray.map<GraphRepartition>(
            graphJson => GraphRepartition.fromJson(graphJson)
          )
        })
      );
    }

    getRepartitionParams(params:Parameters): Observable<GraphRepartition[]>{
      return this.http.put<IGraphRepartition[]>(this.BASE_URL+"/params/charts/repartition",params.toJson(),{
        headers: { Authorization: `Bearer ${this.token}` }
      }).pipe(
        shareReplay(1),
        map(graphiquesJsonArray => {
          return graphiquesJsonArray.map<GraphRepartition>(
            graphJson => GraphRepartition.fromJson(graphJson)
          )
        })
      );
    }

    //Récupère les données des radars
    getRadars(id_diagnostic:number): Observable<GraphRadar[]>{
      return this.http.get<IGraphRadar[]>(this.GET_ALL_URL+"/charts/radars/"+id_diagnostic,{
        headers: { Authorization: `Bearer ${this.token}` }
      }).pipe(
        shareReplay(1),
        map(graphiquesJsonArray => {
          return graphiquesJsonArray.map<GraphRadar>(
            graphJson => GraphRadar.fromJson(graphJson)
          )
        })
      );
    }

    getRadarsParams(params:Parameters): Observable<GraphRadar[]>{
      return this.http.put<IGraphRadar[]>(this.BASE_URL+"/params/charts/radars",params.toJson(),{
        headers: { Authorization: `Bearer ${this.token}` }
      }).pipe(
        shareReplay(1),
        map(graphiquesJsonArray => {
          return graphiquesJsonArray.map<GraphRadar>(
            graphJson => GraphRadar.fromJson(graphJson)
          )
        })
      );
    }

    //Récupère les différentes structures des acteurs
    getStructures(id: number): Observable<any> {

      return this.http.get<any>(this.BASE_URL + '/structures/' + id ).pipe(shareReplay(1));
    }

    getOccurencesKeyWords(id_diagnostic:number): Observable<GraphMotsCles[]>{
      return this.http.get<IGraphMotsCles[]>(this.BASE_URL+"/mots-cles/"+id_diagnostic,{
        headers: { Authorization: `Bearer ${this.token}` }
      }).pipe(
        shareReplay(1),
        map(graphiquesJsonArray => {
          return graphiquesJsonArray.map<GraphMotsCles>(
            graphJson => GraphMotsCles.fromJson(graphJson)
          )
        })
      );
    }

    //Récupère un diag
    get(id: number,slug:string): Observable<Diagnostic> {
      return this.http.get<IDiagnostic>(this.BASE_URL + '/' + id + '/' + slug,{
        headers: { Authorization: `Bearer ${this.token}` }
      }).pipe(
        shareReplay(1),
        map(diagnosticJson => Diagnostic.fromJson(diagnosticJson))
      );
    }
  
    //Ajout
    add(diagnostic: Diagnostic): Observable<Diagnostic> {
      return this.http.post<IDiagnostic>(this.BASE_URL, diagnostic.toJson(),{
        headers: { Authorization: `Bearer ${this.token}` }
      }).pipe(
        map(diagnosticJson => Diagnostic.fromJson(diagnosticJson))
      );
    }
  
    //Mise à jour
    update(diagnostic: Diagnostic): Observable<Diagnostic> {
      return this.http.put<IDiagnostic>(this.BASE_URL + '/' + diagnostic.id_diagnostic + '/' + diagnostic.slug, diagnostic.toJson(),{
        headers: { Authorization: `Bearer ${this.token}` }
      }).pipe(
        map(diagnosticJson => Diagnostic.fromJson(diagnosticJson))
      );
    }
    
    //Envoie les fichiers au serveur
    sendFiles(formData:FormData){
      return this.http.post<IDiagnostic>(this.BASE_URL + '/upload' ,formData,{
        headers: { Authorization: `Bearer ${this.token}` }
      }).pipe(
        map(diagnosticJson => Diagnostic.fromJson(diagnosticJson))
      );
    }

    //Télécharge un fichier envoyé au serveur
    downloadFile(filePath: string): Observable<Blob> {
      return this.http.get(this.BASE_URL+'/uploads/'+filePath, {
        responseType: 'blob'
      });
    }

    updateAfom(listeAfoms:GraphMotsCles[]): Observable<GraphMotsCles[]> {
      
      return this.http.post<IGraphMotsCles[]>(this.BASE_URL + '/afom/update', listeAfoms,{
        headers: { Authorization: `Bearer ${this.token}` }
      }).pipe(
        map(graphiquesJsonArray => {
          return graphiquesJsonArray.map<GraphMotsCles>(
            graphJson => GraphMotsCles.fromJson(graphJson)
          )
        })
      );
    }

    disableDiag(diagnostic:Diagnostic): Observable<Diagnostic> {
      return this.http.put<IDiagnostic>(this.BASE_URL + '/disable/' + diagnostic.id_diagnostic + '/' + diagnostic.slug, diagnostic.toJson(),{
        headers: { Authorization: `Bearer ${this.token}` }
      }).pipe(
        map(diagnosticJson => Diagnostic.fromJson(diagnosticJson))
      );
    }

    deleteDocument(document:Document):Observable<Diagnostic> {
      return this.http.delete<IDiagnostic>(this.BASE_URL+'/document/delete/'+document.id_document,{
        headers: { Authorization: `Bearer ${this.token}` }
      }).pipe(
        map(diagnosticJson => Diagnostic.fromJson(diagnosticJson))
      )
    }

    importData(file: File,acteur:Acteur): Observable<Acteur> {
      const token = localStorage.getItem('tk_id_token');
      const formData = new FormData();
  
      formData.append('file', file);
      formData.append('acteur', JSON.stringify(acteur)); 

      return this.http.post<IActeur>(this.BASE_URL+"/import-data", formData, {
        headers: {
          Authorization: `Bearer ${token}`

        }
      }).pipe(
        map(acteurJson => Acteur.fromJson(acteurJson))
      );
    }
    
}
