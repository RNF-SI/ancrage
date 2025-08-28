import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AlerteTitreComponent } from './alerte-titre.component';

describe('AlerteTitreComponent', () => {
  let component: AlerteTitreComponent;
  let fixture: ComponentFixture<AlerteTitreComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AlerteTitreComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AlerteTitreComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
