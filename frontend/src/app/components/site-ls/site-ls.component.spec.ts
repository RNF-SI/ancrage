import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SiteLsComponent } from './site-ls.component';

describe('SiteLsComponent', () => {
  let component: SiteLsComponent;
  let fixture: ComponentFixture<SiteLsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SiteLsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SiteLsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
