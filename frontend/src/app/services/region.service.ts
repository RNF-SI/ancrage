import { Injectable } from '@angular/core';
import { IRegion } from '@app/interfaces/region.interface';
import { Region } from '@app/models/region.model';
import { BaseEntityService } from './base-entity.service';

@Injectable({
  providedIn: 'root'
})
export class RegionService extends BaseEntityService<Region, IRegion> {

  constructor() {
    super('regions', Region, 'nom_reg');
  }

}