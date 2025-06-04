import { Component, OnInit, HostListener, Renderer2 } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { QuestionService } from 'src/app/services/QuizServices/question.service';
import { ResponseService } from 'src/app/services/QuizServices/response.service';
import { Question } from 'src/app/Model/QuizModel/question';
import { QuizService } from 'src/app/services/QuizServices/quiz.service';
import { DragAndDropPair } from 'src/app/Model/QuizModel/dragAndDropPair';
import { Location } from '@angular/common';

interface QuestionWithResponses extends Question {
  responses?: any[]; // Adjust the type based on your actual Response model
  dragAndDropPairs?: DragAndDropPair[];
}

@Component({
  selector: 'take-quiz-training',
  templateUrl: './take-quiz-training.component.html',
  styleUrls: ['./take-quiz-training.component.scss']
})
export class TakeQuizTrainingComponent implements OnInit {
  quizId: number | null = null;
  quizDetails: any = null;
  questions: QuestionWithResponses[] = [];
  selectedResponses: { [key: number]: number } = {};
  currentQuestionIndex: number = 0;
  showQuizQuestions: boolean = false;
  isSubmitted: boolean = false;
  questionStatuses: { [questionId: number]: 'correct' | 'incorrect' | 'not_submitted' } = {};
  correctAnswers: { [questionId: number]: any } = {}; // Store correct answers for display
  submittedResponses: { [questionId: number]: any } = {}; // Store submitted response for each question

  dragAndDropPairs: { [questionId: number]: DragAndDropPair[] } = {};
  shuffledDragAndDropPairs: { [questionId: number]: DragAndDropPair[] } = {};
  droppedItems: { [key: string]: DragAndDropPair } = {};
  dragAndDropStatuses: { [questionId: number]: { [pairId: string]: boolean | null } } = {};
  correctDragAndDropOrder: { [questionId: number]: DragAndDropPair[] } = {};

  constructor(
    private renderer: Renderer2,
    private route: ActivatedRoute,
    private questionService: QuestionService,
    private responseService: ResponseService,
    private quizService: QuizService,
    private location: Location, // Injecter le service Location
    private router: Router // Injectez Router
  ) {}

  ngOnInit(): void {
    this.renderer.addClass(document.body, 'take-quiz-training-active-body'); // Add class on init

    this.quizId = Number(this.route.snapshot.paramMap.get('quizId'));
    this.loadQuizDetails();

    this.route.queryParams.subscribe(params => {
    });
  }

  ngOnDestroy(): void {
    this.renderer.removeClass(document.body, 'take-quiz-training-active-body'); // Remove class on destroy
  }

  loadQuizDetails(): void {
    if (this.quizId !== null) {
      this.quizService.getQuizById(this.quizId).subscribe(quiz => {
        this.quizDetails = quiz;
      });
    }
  }

  loadQuestions(): void {
    if (this.quizId !== null) {
      this.questionService.getListQuestionsByQuizId(this.quizId).subscribe(questions => {
        const shuffledQuestions = this.shuffleArray(questions); // Mélanger les questions ici

        const requests: Observable<any>[] = shuffledQuestions.map(question => {
          if (question.type === 'MULTIPLE_CHOICE') {
            return this.responseService.getListResponsesByQuestionId(question.idQuestion).pipe(
              map(responses => ({ ...question, responses: this.shuffleArray(responses) }))
            );
          } else if (question.type === 'DRAG_AND_DROP') {
            return this.responseService.getListDragAndDropByQuestionId(question.idQuestion).pipe(
              map(dragAndDropPairs => ({ ...question, dragAndDropPairs: this.shuffleArray(dragAndDropPairs) }))
            );
          } else {
            return this.responseService.getListResponsesByQuestionId(question.idQuestion).pipe(
              map(responses => ({ ...question, responses: this.shuffleArray(responses) }))
            );
          }
        });

        // Utiliser forkJoin pour combiner tous les Observables en un seul
        forkJoin(requests).subscribe(completeQuestions => {
          this.questions = completeQuestions;
          this.questions.forEach(question => {
            this.questionStatuses[question.idQuestion] = 'not_submitted';
            if (question.dragAndDropPairs) {
              this.dragAndDropPairs[question.idQuestion] = question.dragAndDropPairs;
              this.shuffledDragAndDropPairs[question.idQuestion] = this.shuffleArray(JSON.parse(JSON.stringify(question.dragAndDropPairs)));
              this.dragAndDropStatuses[question.idQuestion] = {};
              question.dragAndDropPairs.forEach(pair => {
                this.dragAndDropStatuses[question.idQuestion][`<span class="math-inline">\{pair\.idDragAndDrop\}\-</span>{pair.targetText}`] = null;
              });
              // Assuming the backend returns the correct order in the dragAndDropPairs initially
              this.correctDragAndDropOrder[question.idQuestion] = [...question.dragAndDropPairs];
            } else if (question.responses) {
              // Assuming the backend marks the correct response with a property like 'isCorrect'
              const correctAnswer = question.responses.find(res => res.responseCorrect);
              if (correctAnswer) {
                this.correctAnswers[question.idQuestion] = correctAnswer.idResponse;
              }
            }
          });
          this.showQuizQuestions = true;
          this.currentQuestionIndex = 0;
        });
      });
    }
  }

  shuffleArray(array: any[]): any[] {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  }

  onDragStart(event: DragEvent, pair: DragAndDropPair) {
    event.dataTransfer?.setData('text/plain', pair.idDragAndDrop.toString()); // Stocker l'ID de la paire
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    const target = event.target as HTMLElement;
    if (target.classList.contains('drop-item')) {
      target.classList.add('highlight'); // Highlight target on drag over
    }
  }

  onDrop(event: DragEvent, questionId: number, targetPairId: number) {
    event.preventDefault();
    const draggedPairId = event.dataTransfer?.getData('text/plain');
    const draggedPair = this.dragAndDropPairs[questionId].find(pair => pair.idDragAndDrop === Number(draggedPairId));
    const targetKey = `${questionId}-${targetPairId}`;
    if (draggedPair) {
      this.droppedItems[targetKey] = draggedPair; // Store the dropped DragAndDropPair object
      const index = this.shuffledDragAndDropPairs[questionId].findIndex(p => p.idDragAndDrop === Number(draggedPairId));
      if (index !== -1) {
        this.shuffledDragAndDropPairs[questionId].splice(index, 1);
      }
      console.log('onDrop - shuffledDragAndDropPairs:', this.shuffledDragAndDropPairs[questionId]);
      console.log('onDrop - droppedItems:', this.droppedItems);
    }
  }

  trackByPair(index: number, pair: DragAndDropPair): number {
    return pair.idDragAndDrop;
  }

  resetDrop(questionId: number, targetPairId: number) {
    const droppedPair = this.droppedItems[`${questionId}-${targetPairId}`];
    if (droppedPair) {
      this.shuffledDragAndDropPairs[questionId].push(droppedPair);
      delete this.droppedItems[`${questionId}-${targetPairId}`];
      console.log('resetDrop - shuffledDragAndDropPairs:', this.shuffledDragAndDropPairs[questionId]);
      console.log('resetDrop - droppedItems:', this.droppedItems);
      // Mise à jour de la vue
      this.shuffledDragAndDropPairs = { ...this.shuffledDragAndDropPairs };
      this.droppedItems = { ...this.droppedItems };
    }
  }

  nextQuestion(): void {
    if (this.currentQuestionIndex < this.questions.length - 1) {
      this.currentQuestionIndex++;
    }
  }

  prevQuestion(): void {
    if (this.currentQuestionIndex > 0) {
      this.currentQuestionIndex--;
    }
  }

  submitSingleQuestion(question: QuestionWithResponses): void {
    this.questionStatuses[question.idQuestion] = 'incorrect'; // Default to incorrect
    this.submittedResponses[question.idQuestion] = this.selectedResponses[question.idQuestion]; // Store the currently selected response

    if (question.type === 'MULTIPLE_CHOICE') {
      const selectedResponseId = this.selectedResponses[question.idQuestion];
      const correctAnswerObject = question.responses?.find(res => res.responseCorrect);
      const correctAnswerId = correctAnswerObject ? correctAnswerObject.idResponse : null;
      this.correctAnswers[question.idQuestion] = correctAnswerId; // Store the correct answer ID

      if (selectedResponseId && question.responses) {
        const selectedResponse = question.responses.find(res => res.idResponse === selectedResponseId);

        if (selectedResponse && correctAnswerId && selectedResponse.idResponse === correctAnswerId) {
          this.questionStatuses[question.idQuestion] = 'correct';
          console.log(`Question ID: ${question.idQuestion} - Status set to correct`);
        } else {
          this.questionStatuses[question.idQuestion] = 'incorrect';
          console.log(`Question ID: ${question.idQuestion} - Status set to incorrect`);
        }
      } else {
        // If no answer is selected, mark as incorrect
        this.questionStatuses[question.idQuestion] = 'incorrect';
        console.log(`Question ID: ${question.idQuestion} - No answer selected, marked incorrect`);
      }
      console.log(`Question ID: ${question.idQuestion} - Final Status:`, this.questionStatuses[question.idQuestion]);
    } else if (question.type === 'DRAG_AND_DROP') {
      let allCorrect = true;
      const currentQuestionDroppedItems: { [key: string]: DragAndDropPair | undefined } = {};
      for (const pair of this.dragAndDropPairs[question.idQuestion]) {
        currentQuestionDroppedItems[`${question.idQuestion}-${pair.idDragAndDrop}`] = this.droppedItems[`${question.idQuestion}-${pair.idDragAndDrop}`];
      }
      this.submittedResponses[question.idQuestion] = currentQuestionDroppedItems;

      for (const pair of this.dragAndDropPairs[question.idQuestion]) {
        const droppedItem = this.droppedItems[`${question.idQuestion}-${pair.idDragAndDrop}`];
        if (!droppedItem || droppedItem.targetText !== pair.targetText) {
          allCorrect = false;
          break;
        }
      }
      if (allCorrect) {
        this.questionStatuses[question.idQuestion] = 'correct';
      }
    }
  }

  isCorrectMultipleChoice(questionId: number, responseId: number): boolean {
    return this.questionStatuses[questionId] === 'correct' && responseId === this.correctAnswers[questionId];
  }

  isIncorrectMultipleChoice(questionId: number, responseId: number): boolean {
    return this.questionStatuses[questionId] === 'incorrect' && this.submittedResponses[questionId] === responseId && responseId !== this.correctAnswers[questionId];
  }

  isCorrectDragItem(questionId: number, pair: DragAndDropPair): boolean {
    return this.questionStatuses[questionId] === 'correct' && this.droppedItems[`${questionId}-${pair.idDragAndDrop}`]?.targetText === pair.targetText;
  }

  isIncorrectDragItem(questionId: number, pair: DragAndDropPair): boolean {
    return this.questionStatuses[questionId] === 'incorrect' && this.droppedItems[`${questionId}-${pair.idDragAndDrop}`]?.targetText !== pair.targetText;
  }

  submitQuiz(): void {
    // You might want to disable the main submit button or handle it differently
    // when individual submissions are enabled.
    alert('The main submit button is disabled when submitting questions individually.');
    console.log('Current question statuses:', this.questionStatuses);
    console.log('Submitted responses:', this.submittedResponses);
  }

  goBack(): void {
    this.location.back(); // Utiliser location.back()
  }
}