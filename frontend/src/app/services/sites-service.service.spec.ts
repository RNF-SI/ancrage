import { TestBed } from '@angular/core/testing';

import { SitesServiceService } from './sites-service.service';

describe('SitesServiceService', () => {
  let service: SitesServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SitesServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
