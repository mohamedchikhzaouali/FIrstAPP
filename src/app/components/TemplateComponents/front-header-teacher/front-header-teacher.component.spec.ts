import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FrontHeaderTeacherComponent } from './front-header-teacher.component';

describe('FrontHeaderTeacherComponent', () => {
  let component: FrontHeaderTeacherComponent;
  let fixture: ComponentFixture<FrontHeaderTeacherComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [FrontHeaderTeacherComponent]
    });
    fixture = TestBed.createComponent(FrontHeaderTeacherComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
