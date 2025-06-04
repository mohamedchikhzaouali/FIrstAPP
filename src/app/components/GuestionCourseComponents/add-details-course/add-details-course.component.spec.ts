import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddDetailsCourseComponent } from './add-details-course.component';

describe('AddDetailsCourseComponent', () => {
  let component: AddDetailsCourseComponent;
  let fixture: ComponentFixture<AddDetailsCourseComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AddDetailsCourseComponent]
    });
    fixture = TestBed.createComponent(AddDetailsCourseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
