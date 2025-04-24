import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AlerteSiteComponent } from './alerte-site.component';

describe('AlerteSiteComponent', () => {
  let component: AlerteSiteComponent;
  let fixture: ComponentFixture<AlerteSiteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AlerteSiteComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AlerteSiteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
