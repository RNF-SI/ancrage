import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IntroConnectComponent } from './intro-connect.component';

describe('IntroConnectComponent', () => {
  let component: IntroConnectComponent;
  let fixture: ComponentFixture<IntroConnectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ IntroConnectComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IntroConnectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
