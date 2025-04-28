import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AlerteVisualisationSiteComponent } from './alerte-visualisation-site.component';

describe('AlerteVisualisationSiteComponent', () => {
  let component: AlerteVisualisationSiteComponent;
  let fixture: ComponentFixture<AlerteVisualisationSiteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AlerteVisualisationSiteComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AlerteVisualisationSiteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
