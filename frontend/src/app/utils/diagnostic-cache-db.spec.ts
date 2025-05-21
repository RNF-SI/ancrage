import { TestBed } from '@angular/core/testing';

import { DiagnosticCacheDb } from './diagnostic-cache-db';

describe('DiagnosticCacheDbService', () => {
  let service: DiagnosticCacheDb;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DiagnosticCacheDb);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
