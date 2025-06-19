import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActeurComponent } from './acteur.component';

describe('ActeurComponent', () => {
  let component: ActeurComponent;
  let fixture: ComponentFixture<ActeurComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ActeurComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ActeurComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
