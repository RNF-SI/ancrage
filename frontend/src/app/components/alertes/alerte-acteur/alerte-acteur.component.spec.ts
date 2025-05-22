import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AlerteActeurComponent } from './alerte-acteur.component';

describe('AlerteActeurComponent', () => {
  let component: AlerteActeurComponent;
  let fixture: ComponentFixture<AlerteActeurComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AlerteActeurComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AlerteActeurComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
