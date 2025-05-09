import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AlerteShowActorDetailsComponent } from './alerte-show-actor-details.component';

describe('AlerteShowActorDetailsComponent', () => {
  let component: AlerteShowActorDetailsComponent;
  let fixture: ComponentFixture<AlerteShowActorDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AlerteShowActorDetailsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AlerteShowActorDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
