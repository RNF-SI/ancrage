import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChoixActeursComponent } from './choix-acteurs.component';

describe('ChoixActeursComponent', () => {
  let component: ChoixActeursComponent;
  let fixture: ComponentFixture<ChoixActeursComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ChoixActeursComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChoixActeursComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
