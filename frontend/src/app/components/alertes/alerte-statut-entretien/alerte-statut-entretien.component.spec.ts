import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AlerteStatutEntretienComponent } from './alerte-statut-entretien.component';

describe('AlerteStatutEntretienComponent', () => {
  let component: AlerteStatutEntretienComponent;
  let fixture: ComponentFixture<AlerteStatutEntretienComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AlerteStatutEntretienComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AlerteStatutEntretienComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
