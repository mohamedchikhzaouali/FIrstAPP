import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CoursesSoonComponent } from './courses-soon.component';

describe('CoursesSoonComponent', () => {
  let component: CoursesSoonComponent;
  let fixture: ComponentFixture<CoursesSoonComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CoursesSoonComponent]
    });
    fixture = TestBed.createComponent(CoursesSoonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
