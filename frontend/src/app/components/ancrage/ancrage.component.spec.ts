import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AncrageComponent } from './ancrage.component';

describe('AncrageComponent', () => {
  let component: AncrageComponent;
  let fixture: ComponentFixture<AncrageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AncrageComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AncrageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
