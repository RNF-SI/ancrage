import { TestBed } from '@angular/core/testing';

import { DiagnosticStoreService } from './diagnostic-store.service';

describe('DiagnosticStoreServiceService', () => {
  let service: DiagnosticStoreService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DiagnosticStoreService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
