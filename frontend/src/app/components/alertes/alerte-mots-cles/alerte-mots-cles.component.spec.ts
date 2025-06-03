import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AlerteMotsClesComponent } from './alerte-mots-cles.component';

describe('AlerteMotsClesComponent', () => {
  let component: AlerteMotsClesComponent;
  let fixture: ComponentFixture<AlerteMotsClesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AlerteMotsClesComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AlerteMotsClesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
