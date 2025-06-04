import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuizStatisticsComponent } from './quiz-statistics.component';

describe('QuizStatisticsComponent', () => {
  let component: QuizStatisticsComponent;
  let fixture: ComponentFixture<QuizStatisticsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [QuizStatisticsComponent]
    });
    fixture = TestBed.createComponent(QuizStatisticsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
