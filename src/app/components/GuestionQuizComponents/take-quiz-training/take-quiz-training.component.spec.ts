import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TakeQuizTrainingComponent } from './take-quiz-training.component';

describe('TakeQuizTrainingComponent', () => {
  let component: TakeQuizTrainingComponent;
  let fixture: ComponentFixture<TakeQuizTrainingComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TakeQuizTrainingComponent]
    });
    fixture = TestBed.createComponent(TakeQuizTrainingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
