import { Injectable } from '@angular/core';
import { GeoJsonPoint, GeoJsonSiteGeom } from '@app/interfaces/site.interface';
import { IDepartement } from '@app/interfaces/departement.interface';
import { Departement } from '@app/models/departement.model';
import { Observable, map, of } from 'rxjs';
import { environment } from 'src/environments/environment';
import { BaseEntityService } from './base-entity.service';

@Injectable({
  providedIn: 'root'
})
export class DepartementService extends BaseEntityService<Departement, IDepartement> {

  constructor() {
    super('departements', Departement, 'nom_dep');
  }

  findByIntersection(
    geom: GeoJsonSiteGeom | null,
    geomPt: GeoJsonPoint | null,
    positionX?: string,
    positionY?: string
  ): Observable<Departement[]> {
    const body: Record<string, unknown> = {};
    if (geom) {
      body['geom'] = geom;
    } else if (geomPt) {
      body['geom_pt'] = geomPt;
    } else if (positionX && positionY) {
      body['position_x'] = positionX;
      body['position_y'] = positionY;
    } else {
      return of([]);
    }

    const url = `${environment.flask_server}departements/intersects`;
    const token = localStorage.getItem('tk_id_token');
    return this.http.post<IDepartement[]>(url, body, {
      headers: { Authorization: `Bearer ${token}` },
    }).pipe(
      map(departements => departements.map(d => Departement.fromJson(d)))
    );
  }

}