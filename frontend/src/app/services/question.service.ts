import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { IQuestion } from '@app/interfaces/question.interface';
import { Question } from '@app/models/question.model';
import { Observable, map, shareReplay } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class QuestionService {

  private GET_ALL_URL = environment.flask_server + 'questions';
  private BASE_URL = environment.flask_server+'question';
  private http = inject(HttpClient);
  private token = localStorage.getItem('tk_id_token');
  
  //Récupère un acteur
  get(libelle:string): Observable<Question> {
    return this.http.get<IQuestion>(this.BASE_URL + '/'+ libelle,{
      headers: { Authorization: `Bearer ${this.token}` }
      }).pipe(
      map(questionJson => Question.fromJson(questionJson))
    );
  }

  getAll(): Observable<Question[]> {
      return this.http.get<IQuestion[]>(this.GET_ALL_URL,{
        headers: { Authorization: `Bearer ${this.token}` }
        }).pipe(
        shareReplay(1),
        map(questionsJsonArray => {
          return questionsJsonArray.map<Question>(
            questionJson => Question.fromJson(questionJson)
          )
        })
      );
  }

  getAllWithLimit(limit:number): Observable<Question[]> {
    return this.http.get<IQuestion[]>(this.GET_ALL_URL+"/"+limit,{
      headers: { Authorization: `Bearer ${this.token}` }
      }).pipe(
      shareReplay(1),
      map(questionsJsonArray => {
        return questionsJsonArray.map<Question>(
          questionJson => Question.fromJson(questionJson)
        )
      })
    );
}
}
