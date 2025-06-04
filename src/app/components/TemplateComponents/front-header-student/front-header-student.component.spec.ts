import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FrontHeaderStudentComponent } from './front-header-student.component';

describe('FrontHeaderStudentComponent', () => {
  let component: FrontHeaderStudentComponent;
  let fixture: ComponentFixture<FrontHeaderStudentComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [FrontHeaderStudentComponent]
    });
    fixture = TestBed.createComponent(FrontHeaderStudentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
