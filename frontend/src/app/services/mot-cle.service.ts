import { Observable, map } from 'rxjs';
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MotCle } from '@app/models/mot-cle.model';
import { environment } from 'src/environments/environment';
import { IMotCle } from '@app/interfaces/mot_cle.interface';

@Injectable({
	providedIn: 'root'
})

export class MotCleService {

	private GET_ALL_URL = environment.flask_server+'mots_cles';
	private http = inject(HttpClient);

	//Récupère tous les motCles
	getAllByDiag(id_diagnostic:number): Observable<MotCle[]> {
		return this.http.get<IMotCle[]>(this.GET_ALL_URL +'/'+id_diagnostic ).pipe(
			map(motCleJsonArray => {
				return motCleJsonArray.map<MotCle>(
					motCleJson => MotCle.fromJson(motCleJson)
				)
			})
		);
	}

	getKeywordsByActor(id_acteur:number): Observable<MotCle[]>{
		  return this.http.get<IMotCle[]>(this.GET_ALL_URL+'/theme/'+id_acteur).pipe(
			map(nomenclatureJsonArray => {
			  return nomenclatureJsonArray.map<MotCle>(
				nomenclatureJson => MotCle.fromJson(nomenclatureJson)
			  )
			})
		  );
	}

	sortByName(objArray:MotCle[]){
		objArray.sort(function(a, b) {
		  var textA = a.nom.toUpperCase();
		  var textB = b.nom.toUpperCase();
		  return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
		})
	}
}