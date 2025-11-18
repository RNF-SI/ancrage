import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AlerteDiagnosticComponent } from './alerte-diagnostic.component';

describe('AlerteDiagnosticComponent', () => {
  let component: AlerteDiagnosticComponent;
  let fixture: ComponentFixture<AlerteDiagnosticComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AlerteDiagnosticComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AlerteDiagnosticComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
