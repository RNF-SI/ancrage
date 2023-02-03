import { Router, ActivatedRoute } from '@angular/router';
import { Injectable } from '@angular/core';
import { AppConfig } from '../../conf/app.config'
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, forkJoin, iif, map, Observable, switchMap, throwError } from "rxjs";
import {mergeMap, tap} from 'rxjs/operators';
import { ModuleService } from './module.service';
// import { IdleService } from '@app/services/idle.service';

import {User} from "../models/user.model";
// import { Role } from '@app/models/role-opnl.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  public user: User|null = null;
  loginError: boolean = false;
  public isLoading = false;

  constructor(
    private _http: HttpClient,
    private moduleService: ModuleService,
    private router: Router,
    private route: ActivatedRoute,
    // public _idleService: IdleService,


  ) { }

  /** Returns true if user is logged in */
  public get authenticated(): boolean {
    if(this.getCurrentUser()!=null){
      return true
    } else {
      return false;
    }
  }

  /** Returns the current user id, when authenticated */
  get userId(): string {
    // On sait que user a une valeur si authenticated est "true" donc on peut utiliser this.user!
    return this.authenticated ? this.user!.id_role : '';
  }

  // public authorizedFor(id_author:string): boolean {
  //   if (this.getCurrentUserOPNLRole() == 'administrateur' || this.getCurrentUser()?.id_role == id_author) {
  //     return true
  //   } else {
  //     return false
  //   }
  // }

  signinUser(identifiant: string, password: string): Observable<any> {
    const headers= new HttpHeaders()
      .set('content-type', 'application/json')
      .set('Access-Control-Allow-Origin', '*');

    this.isLoading = true;

    const options = {
      login: 'test',
      password: 'test',
      id_application: AppConfig.ID_APPLICATION_ANCRAGE
    };
    // const options = {
    //   login: identifiant,
    //   password: password,
    //   id_application: AppConfig.ID_APPLICATION_ANCRAGE
    // };
    // const httpOptions = {
    //   headers: { 'Content-Type': 'application/json' },
    // };
    // const obs1$ = 
    // return this._http
    //   .post<any>(`${AppConfig.API_ENDPOINT}/pypn/auth/login`, JSON.stringify(options), httpOptions);
    const obs1$ = this._http
      // .post<any>(`${AppConfig.API_ENDPOINT}/auth/login`, JSON.stringify(options));
      .post<any>(`${AppConfig.API_ENDPOINT}/auth/login`, JSON.stringify(options),  { 'headers': headers })
      .pipe(
        tap((userInfos) => {

          const userForFront = new User(
            userInfos.user.identifiant,
            userInfos.user.id_role,
            userInfos.user.id_organisme,
            userInfos.user.prenom_role,
            userInfos.user.nom_role,
            userInfos.user.nom_role + ' ' + userInfos.user.prenom_role,
          );

          this.setCurrentUser(userForFront);
          this.loginError = false;
          // this.ref.close(user);
          this.isLoading = false;
          let next = this.route.snapshot.queryParams['next'];
          let route = this.route.snapshot.queryParams['route'];
          // next means redirect to url
          // route means navigate to angular route
          if (next) {
              if (route) {
                  window.location.href = next + '#' + route;
              } else {
                  window.location.href = next;
              }
          } else if (route) {
              this.router.navigateByUrl(route);
          } else {
              this.router.navigate(['']);
          }
        }),
        // error: (error) => {
        //   this.isLoading = false;
        //   this.loginError = true;
        //   return throwError(() => error );       
        // },
        // complete: () => { }
        catchError(error => {
            this.isLoading = false;
            this.loginError = true;
            return throwError(() => error);
          }                           // <-- `catchError` operator *must* return an observable
        )
      )
      
      
      // .pipe(
      //   mergeMap(
      //     userInfos => this._http
      //       .get<any>(`${AppConfig.API_ENDPOINT}/opnl-users/`+userInfos.user.id_role).pipe(
      //         map((userComplementsInfos) => {

      //           const userForFront = new User(
      //             userInfos.user.identifiant,
      //             userInfos.user.id_role,
      //             userInfos.user.id_organisme,
      //             userInfos.user.prenom_role,
      //             userInfos.user.nom_role,
      //             userInfos.user.nom_role + ' ' + userInfos.user.prenom_role,
      //             userComplementsInfos.profil_opnl
      //             );

      //           this.setCurrentUser(userForFront);
      //           this.loginError = false;

      //           // TODO: modif subscribe according to what is wanted in platform
      //           // Now that we are logged, we fetch the cruved again, and redirect once received
      //           forkJoin({
      //               modules: this.moduleService.fetchModules(),
      //           }).subscribe(() => {
      //             this.isLoading = false;
      //             let next = this.route.snapshot.queryParams['next'];
      //             let route = this.route.snapshot.queryParams['route'];
      //             // next means redirect to url
      //             // route means navigate to angular route
      //             if (next) {
      //                 if (route) {
      //                     window.location.href = next + '#' + route;
      //                 } else {
      //                     window.location.href = next;
      //                 }
      //             } else if (route) {
      //                 this.router.navigateByUrl(route);
      //             } else {
      //                 this.router.navigate(['']);
      //             }
      //             // this._idleService.startIdleSvc();
      //           });
      //         }),
      //         catchError(error => {
      //           this.isLoading = false;
      //           this.loginError = true;
      //           return throwError(() => error);
      //         }                           // <-- `catchError` operator *must* return an observable
      //         )
      //     )
      //   )
      // )
    return obs1$;
  }

  setCurrentUser(user: User) {
    localStorage.setItem('current_user', JSON.stringify({
      identifiant: user.user_login,
      id_role: user.id_role,
      id_organisme: user.id_organisme,
      prenom_role: user.prenom_role,
      nom_role: user.nom_role,
      nom_complet: user.nom_complet,
      roleOPNLInfo: user.roleOPNLInfo
    }));
  }

  getCurrentUser(): User|null {
    let currentUser = localStorage.getItem('current_user');
    let user;
    if(currentUser){
      let raw = JSON.parse(currentUser);
      user = new User(
        raw.identifiant,
        raw.id_role,
        raw.id_organisme,
        raw.prenom_role,
        raw.nom_role,
        raw.nom_role + ' ' + raw.prenom_role,
        raw.roleOPNLInfo
      );
    } else {
      user = null
    }
    return user;
  }

  // getCurrentUserOPNLRole(): null | Role {
  //   let currentUser = localStorage.getItem('current_user');
  //   if(currentUser){
  //     return JSON.parse(currentUser).roleOPNLInfo;
  //   } else {
  //     return null;
  //   }
  // }

  logout() {
    // this._idleService.stopIdleSvc();
    this.cleanLocalStorage();
  }

  private cleanLocalStorage() {
    // Remove only local storage items need to clear when user logout
    localStorage.removeItem('current_user');
    localStorage.removeItem('modules');
  }


}
