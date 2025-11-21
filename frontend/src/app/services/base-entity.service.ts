import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, map, shareReplay } from 'rxjs';
import { environment } from 'src/environments/environment';

/**
 * Interface de base pour les entités ayant une méthode fromJson statique
 */
export interface BaseEntityModel<TInterface> {
  fromJson(data: TInterface): any;
}

/**
 * Interface de base pour les constructeurs d'entités
 */
export interface BaseEntityConstructor<TModel, TInterface> {
  new(): TModel;
  fromJson(data: TInterface): TModel;
}

/**
 * Service de base abstrait pour factoriser la logique commune des services géographiques
 * Élimine la duplication de code entre RegionService, DepartementService et CommuneService
 */
export abstract class BaseEntityService<TModel, TInterface> {
  
  protected http = inject(HttpClient);
  private token = localStorage.getItem('tk_id_token');

  constructor(
    protected endpoint: string,
    protected entityConstructor: BaseEntityConstructor<TModel, TInterface>,
    protected nameProperty: keyof TModel
  ) {}

  /**
   * Récupère toutes les entités depuis l'API
   */
  getAll(): Observable<TModel[]> {
    const url = environment.flask_server + this.endpoint;
    return this.http.get<TInterface[]>(url,{
      headers: { Authorization: `Bearer ${this.token}` }
    }).pipe(
      shareReplay(1),
      map(jsonArray => {
        return jsonArray.map<TModel>(
          json => this.entityConstructor.fromJson(json)
        )
      })
    );
  }

  /**
   * Trie un tableau d'entités par nom (ordre alphabétique)
   * @param objArray - Le tableau à trier (modifié en place)
   */
  sortByName(objArray: TModel[]): void {
    objArray.sort((a, b) => {
      const textA = String(a[this.nameProperty]).toUpperCase();
      const textB = String(b[this.nameProperty]).toUpperCase();
      return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
    });
  }
}