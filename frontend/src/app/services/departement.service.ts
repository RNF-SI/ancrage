import { Injectable } from '@angular/core';
import { IDepartement } from '@app/interfaces/departement.interface';
import { Departement } from '@app/models/departement.model';
import { BaseEntityService } from './base-entity.service';

@Injectable({
  providedIn: 'root'
})
export class DepartementService extends BaseEntityService<Departement, IDepartement> {

  constructor() {
    super('departements', Departement, 'nom_dep');
  }

}
