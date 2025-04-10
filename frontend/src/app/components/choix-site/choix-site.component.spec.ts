import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChoixSiteComponent } from './choix-site.component';

describe('ChoixSiteComponent', () => {
  let component: ChoixSiteComponent;
  let fixture: ComponentFixture<ChoixSiteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ChoixSiteComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChoixSiteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
