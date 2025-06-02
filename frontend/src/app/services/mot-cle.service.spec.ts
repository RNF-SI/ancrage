import { TestBed } from '@angular/core/testing';

import { MotCleService } from './mot-cle.service';

describe('MotCleService', () => {
  let service: MotCleService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MotCleService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
