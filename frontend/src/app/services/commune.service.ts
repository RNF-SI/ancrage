import { Injectable } from '@angular/core';
import { ICommune } from '@app/interfaces/commune.interface';
import { Commune } from '@app/models/commune.model';
import { BaseEntityService } from './base-entity.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CommuneService extends BaseEntityService<Commune, ICommune> {

    private BASE_URL = environment.flask_server+'commune/';
    
    constructor() {
      super('communes', Commune, 'nom_com');
    }
  
  }