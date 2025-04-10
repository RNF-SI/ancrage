import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DiagosticsListeComponent } from './diagnostics-liste.component';

describe('DiagosticsListeComponent', () => {
  let component: DiagosticsListeComponent;
  let fixture: ComponentFixture<DiagosticsListeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DiagosticsListeComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DiagosticsListeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
