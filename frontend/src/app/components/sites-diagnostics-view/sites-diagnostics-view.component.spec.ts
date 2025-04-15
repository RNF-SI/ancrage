import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SitesDiagnosticsViewComponent } from './sites-diagnostics-view.component';

describe('SitesDiagnosticsViewComponent', () => {
  let component: SitesDiagnosticsViewComponent;
  let fixture: ComponentFixture<SitesDiagnosticsViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SitesDiagnosticsViewComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SitesDiagnosticsViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
