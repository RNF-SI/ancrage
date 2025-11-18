import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TableauStructuresComponent } from './tableau-structures.component';

describe('TableauStructuresComponent', () => {
  let component: TableauStructuresComponent;
  let fixture: ComponentFixture<TableauStructuresComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TableauStructuresComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TableauStructuresComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
