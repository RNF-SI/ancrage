import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MotsClesZoneComponent } from './mots-cles-zone.component';

describe('MotsClesZoneComponent', () => {
  let component: MotsClesZoneComponent;
  let fixture: ComponentFixture<MotsClesZoneComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MotsClesZoneComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MotsClesZoneComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
