import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AlerteDatePublicationComponent } from './alerte-date-publication.component';

describe('AlerteDatePublicationComponent', () => {
  let component: AlerteDatePublicationComponent;
  let fixture: ComponentFixture<AlerteDatePublicationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AlerteDatePublicationComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AlerteDatePublicationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
