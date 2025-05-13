import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AlerteEntretienComponent } from './alerte-entretien.component';

describe('AlerteEntretienComponent', () => {
  let component: AlerteEntretienComponent;
  let fixture: ComponentFixture<AlerteEntretienComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AlerteEntretienComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AlerteEntretienComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
