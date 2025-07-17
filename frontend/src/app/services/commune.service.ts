import { Injectable } from '@angular/core';
import { ICommune } from '@app/interfaces/commune.interface';
import { Commune } from '@app/models/commune.model';
import { BaseEntityService } from './base-entity.service';


@Injectable({
  providedIn: 'root'
})
export class CommuneService extends BaseEntityService<Commune, ICommune> {
    
    constructor() {
      super('communes', Commune, 'nom_com');
    }
  
}
