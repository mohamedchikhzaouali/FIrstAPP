import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FavoritCoursesComponent } from './favorit-courses.component';

describe('FavoritCoursesComponent', () => {
  let component: FavoritCoursesComponent;
  let fixture: ComponentFixture<FavoritCoursesComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [FavoritCoursesComponent]
    });
    fixture = TestBed.createComponent(FavoritCoursesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
