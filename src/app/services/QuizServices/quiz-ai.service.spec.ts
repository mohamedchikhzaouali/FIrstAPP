import { TestBed } from '@angular/core/testing';

import { QuizAIService } from './quiz-ai.service';

describe('QuizAIServiceService', () => {
  let service: QuizAIService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(QuizAIService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
