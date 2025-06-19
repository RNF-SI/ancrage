import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of } from 'rxjs';

import { ReferenceDataService } from './reference-data.service';
import { CommuneService } from './commune.service';
import { DepartementService } from './departement.service';
import { NomenclatureService } from './nomenclature.service';

describe('ReferenceDataService', () => {
  let service: ReferenceDataService;
  let communeService: jasmine.SpyObj<CommuneService>;
  let departementService: jasmine.SpyObj<DepartementService>;
  let nomenclatureService: jasmine.SpyObj<NomenclatureService>;

  beforeEach(() => {
    const communeSpy = jasmine.createSpyObj('CommuneService', ['getAll', 'sortByName']);
    const departementSpy = jasmine.createSpyObj('DepartementService', ['getAll', 'sortByName']);
    const nomenclatureSpy = jasmine.createSpyObj('NomenclatureService', ['getAllByType', 'sortByName']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        { provide: CommuneService, useValue: communeSpy },
        { provide: DepartementService, useValue: departementSpy },
        { provide: NomenclatureService, useValue: nomenclatureSpy }
      ]
    });
    
    service = TestBed.inject(ReferenceDataService);
    communeService = TestBed.inject(CommuneService) as jasmine.SpyObj<CommuneService>;
    departementService = TestBed.inject(DepartementService) as jasmine.SpyObj<DepartementService>;
    nomenclatureService = TestBed.inject(NomenclatureService) as jasmine.SpyObj<NomenclatureService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should cache reference data and not call services twice', () => {
    // Setup
    communeService.getAll.and.returnValue(of([]));
    departementService.getAll.and.returnValue(of([]));
    nomenclatureService.getAllByType.and.returnValue(of([]));

    // First call
    service.getBasicReferenceData().subscribe();
    
    // Second call
    service.getBasicReferenceData().subscribe();

    // Verify services are called only once due to caching
    expect(communeService.getAll).toHaveBeenCalledTimes(1);
    expect(departementService.getAll).toHaveBeenCalledTimes(1);
    expect(nomenclatureService.getAllByType).toHaveBeenCalledWith('categories');
    expect(nomenclatureService.getAllByType).toHaveBeenCalledWith('profil');
    expect(nomenclatureService.getAllByType).toHaveBeenCalledWith('statut');
  });

  it('should clear cache correctly', () => {
    // Setup
    communeService.getAll.and.returnValue(of([]));
    departementService.getAll.and.returnValue(of([]));
    nomenclatureService.getAllByType.and.returnValue(of([]));

    // First call
    service.getBasicReferenceData().subscribe();
    
    // Clear cache
    service.clearCache();
    
    // Second call after cache clear
    service.getBasicReferenceData().subscribe();

    // Verify services are called twice (no cache)
    expect(communeService.getAll).toHaveBeenCalledTimes(2);
  });
});