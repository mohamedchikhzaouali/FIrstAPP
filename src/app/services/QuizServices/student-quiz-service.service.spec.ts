import { TestBed } from '@angular/core/testing';

import { StudentQuizService } from './student-quiz-service.service';

describe('StudentQuizServiceService', () => {
  let service: StudentQuizService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StudentQuizService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
