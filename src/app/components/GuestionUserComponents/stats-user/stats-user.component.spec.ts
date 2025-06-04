import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StatUserComponent } from './stats-user.component';

describe('StatUserComponent', () => {
  let component: StatUserComponent;
  let fixture: ComponentFixture<StatUserComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [StatUserComponent]
    });
    fixture = TestBed.createComponent(StatUserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
