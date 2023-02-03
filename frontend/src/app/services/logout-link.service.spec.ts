import { TestBed } from '@angular/core/testing';

import { LogoutLinkService } from './logout-link.service';

describe('LogoutLinkService', () => {
  let service: LogoutLinkService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LogoutLinkService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
