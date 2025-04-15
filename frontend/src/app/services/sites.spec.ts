import { TestBed } from '@angular/core/testing';
import { SiteService } from './sites.service';


describe('SitesServiceService', () => {
  let service: SiteService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SiteService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
