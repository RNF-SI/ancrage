import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AlerteGroupeMotsClesComponent } from './alerte-groupe-mots-cles.component';

describe('AlerteGroupeMotsClesComponent', () => {
  let component: AlerteGroupeMotsClesComponent;
  let fixture: ComponentFixture<AlerteGroupeMotsClesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AlerteGroupeMotsClesComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AlerteGroupeMotsClesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
