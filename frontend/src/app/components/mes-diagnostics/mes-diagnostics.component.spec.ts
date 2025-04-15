import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MesDiagnosticsComponent } from './mes-diagnostics.component';

describe('MesDiagnosticsComponent', () => {
  let component: MesDiagnosticsComponent;
  let fixture: ComponentFixture<MesDiagnosticsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MesDiagnosticsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MesDiagnosticsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
