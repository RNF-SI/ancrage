import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DiagnosticVisualisationComponent } from './diagnostic-visualisation.component';

describe('DiagnosticVisualisationComponent', () => {
  let component: DiagnosticVisualisationComponent;
  let fixture: ComponentFixture<DiagnosticVisualisationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DiagnosticVisualisationComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DiagnosticVisualisationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
