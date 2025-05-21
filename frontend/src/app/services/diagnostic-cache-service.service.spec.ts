import { TestBed } from '@angular/core/testing';

import { DiagnosticCacheService } from './diagnostic-cache-service.service';

describe('DiagnosticCacheServiceService', () => {
  let service: DiagnosticCacheService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DiagnosticCacheService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
