import { Observable, map } from 'rxjs';
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Mail } from '@app/models/mail.model';
import { IMail } from '@app/interfaces/mail.interface';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MailService {

  private BASE_URL = environment.flask_server+'mail';
  private http = inject(HttpClient);
  private token = localStorage.getItem('tk_id_token');

  //Récupère les mails en fonction des sites
  sendMail(mail:Mail):Observable<Mail>{
    return this.http.post<IMail>(this.BASE_URL + '/send', mail.toJson(),{
      headers: { Authorization: `Bearer ${this.token}` }
    }).pipe(
        map(mailJson => Mail.fromJson(mailJson))
      );
  }

  
}