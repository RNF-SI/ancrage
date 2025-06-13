import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { IQuestion } from '@app/interfaces/question.interface';
import { Question } from '@app/models/question.model';
import { Observable, map } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class QuestionService {

  private BASE_URL = environment.flask_server+'question';
  private http = inject(HttpClient);
  
  //Récupère un acteur
  get(libelle:string): Observable<Question> {
    return this.http.get<IQuestion>(this.BASE_URL + '/'+ libelle).pipe(
      map(questionJson => Question.fromJson(questionJson))
    );
  }
}
