import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CoursesTeachersComponent } from './courses-teachers.component';

describe('CoursesTeachersComponent', () => {
  let component: CoursesTeachersComponent;
  let fixture: ComponentFixture<CoursesTeachersComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CoursesTeachersComponent]
    });
    fixture = TestBed.createComponent(CoursesTeachersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
