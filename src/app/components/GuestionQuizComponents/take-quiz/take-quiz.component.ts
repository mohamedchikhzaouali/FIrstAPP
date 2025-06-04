// src/app/components/GuestionQuizComponents/take-quiz/take-quiz.component.ts

import { Component, OnInit, HostListener, Renderer2, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, Observable, of, timer } from 'rxjs';
import { catchError, map, takeWhile, tap } from 'rxjs/operators';
import { QuestionService } from 'src/app/services/QuizServices/question.service';
import { ResponseService } from 'src/app/services/QuizServices/response.service';
import { Question } from 'src/app/Model/QuizModel/question';
import { StudentQuiz } from 'src/app/Model/QuizModel/StudentQuiz';
import { QuizService } from 'src/app/services/QuizServices/quiz.service';
import { UserService } from 'src/app/services/UserServices/user.service';
import { StudentQuizService } from 'src/app/services/QuizServices/student-quiz-service.service';
import { jsPDF } from 'jspdf';
import { DragAndDropPair } from 'src/app/Model/QuizModel/dragAndDropPair';
import { Person } from 'src/app/Model/UserModel/user';

@Component({
  selector: 'app-take-quiz',
  templateUrl: './take-quiz.component.html',
  styleUrls: ['./take-quiz.component.scss']
})
export class TakeQuizComponent implements OnInit, OnDestroy {
  quizId: number | null = null;
  quizDetails: any = null;
  name: any = null;
  surname: any = null;
  email: any = null;
  questions: Question[] = [];
  selectedResponses: { [key: number]: number } = {}; // For MULTIPLE_CHOICE
  droppedItems: { [key: string]: DragAndDropPair } = {}; // For DRAG_AND_DROP
  currentQuestionIndex: number = 0;
  showQuizQuestions: boolean = false;
  score: number | null = null;
  timerSeconds: number = 0;
  intervalId: any;
  isSubmitted: boolean = false; // Indicates if the quiz has been submitted in the current session
  quizStarted: boolean = false;
  paymentSuccess: boolean = false;
  payed: boolean = false;
  emailSent: boolean = false;
  quizType: string = '';

  dragAndDropPairs: { [questionId: number]: DragAndDropPair[] } = {};
  shuffledDragAndDropPairs: { [questionId: number]: DragAndDropPair[] } = {};

  private initialQuestionOrder: number[] = [];
  private initialResponseOrders: { [questionId: number]: number[] } = {};
  private initialDragAndDropOrders: { [questionId: number]: number[] } = {};

  constructor(
    private renderer: Renderer2,
    private route: ActivatedRoute,
    private questionService: QuestionService,
    private responseService: ResponseService,
    private quizService: QuizService,
    private studentQuizService: StudentQuizService,
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.renderer.addClass(document.body, 'take-quiz-active-body');

    this.quizId = Number(this.route.snapshot.paramMap.get('quizId'));

    this.loadQuizDetails().subscribe(quiz => {
      this.quizDetails = quiz;
      this.quizType = quiz.type;

      // On initial load, we always check student quiz info first
      // to determine if the quiz is already passed or not.
      this.loadStudentQuizInfo().subscribe(studentQuiz => {
        if (studentQuiz && studentQuiz.passed) {
          alert("You have already passed this quiz. You cannot retake it.");
          // If already passed, do not show quiz questions or results.
          this.score = null; // Ensure score is null on page load
          this.isSubmitted = true; // Mark as submitted to prevent accidental starts
          this.showQuizQuestions = false; // Hide quiz section
          this.router.navigate(['/home-login']); // Or navigate to quiz details page
          return;
        }
        // If not passed, proceed to check and load quiz progress (if any)
        this.checkAndLoadQuizProgress();
      }, error => {
        console.error("Error loading student quiz info:", error);
        // If there's an error getting student quiz info (e.g., 404),
        // it means no record exists, so proceed as if it's a new quiz.
        this.checkAndLoadQuizProgress();
      });
    });

    this.route.queryParams.subscribe(params => {
      if (params['paymentSuccess'] === 'true') {
        this.paymentSuccess = true;
        forkJoin([this.loadStudentQuizInfo()]).subscribe(() => {
          if (!this.payed) {
            this.updatePaymentStatus();
          } else {
            this.showQuizQuestions = false;
            this.score = null;
            this.quizStarted = false;
          }
        });
        forkJoin([this.loadStudentQuizInfo(), this.loadStudentInfo()]).subscribe(() => {
          if (this.payed && !this.emailSent) {
            this.sendPaymentSuccessEmail();
          }
        });
      }
    });
  }

  ngOnDestroy(): void {
    this.renderer.removeClass(document.body, 'take-quiz-active-body');
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  @HostListener('document:visibilitychange', ['$event'])
  onVisibilityChange(event: Event): void {
    if (document.hidden && this.quizStarted && !this.isSubmitted) {
      console.warn("User left tab, auto-submitting quiz.");
      this.autoSubmitQuiz();
    }
  }

  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(event: BeforeUnloadEvent) {
    if (this.quizStarted && !this.isSubmitted) {
      this.saveQuizProgress();
      event.returnValue = true;
    }
  }

  goToPayment(): void {
    this.router.navigate(['/payement-stripe'], { queryParams: { quizId: this.quizId } });
  }

  updatePaymentStatus() {
    if (this.quizId === null) {
      console.error("quizId est null. Impossible de mettre à jour le statut de paiement.");
      return;
    }
    this.studentQuizService.updatePaymentStatus(this.quizId).subscribe(
      (response) => {
        console.log("Statut de paiement mis à jour avec succès :", response);
        this.payed = true;
        this.router.navigate(['/quiz-details', this.quizId]);
      },
      error => {
        console.error("Erreur lors de la mise à jour du statut de paiement :", error);
      }
    );
  }

  updateEmailStatus() {
    if (this.quizId === null) {
      console.error("quizId est null. Impossible de mettre à jour le statut d'email.");
      return;
    }
    this.studentQuizService.updateEmailStatus(this.quizId).subscribe(
      (response) => {
        console.log("Statut d'email mis à jour avec succès :", response);
        this.emailSent = true;
      },
      error => {
        console.error("Erreur lors de la mise à jour du statut d'email :", error);
      }
    );
  }

  loadStudentInfo(): Observable<Person | null> {
    return this.userService.getUserInfo().pipe(
      map((user: any) => {
        this.name = user.name;
        this.surname = user.surname;
        this.email = user.email;
        return user as Person;
      }),
      catchError(error => {
        console.error("Erreur lors de la récupération des informations de l'utilisateur connecté :", error);
        return of(null);
      })
    );
  }

  loadStudentQuizInfo(): Observable<StudentQuiz | null> {
    if (this.quizId != null) {
      return this.studentQuizService.getStudentQuizByStudentAndQuiz(this.quizId).pipe(
        map(studentQuiz => {
          this.payed = studentQuiz.payed;
          this.emailSent = studentQuiz.emailSent;
          // IMPORTANT: Do NOT set this.isSubmitted or this.score here based on studentQuiz.passed
          // if you want to avoid showing the results on page refresh.
          // The result display logic is handled only after a new submission.
          return studentQuiz;
        }),
        catchError(error => {
          if (error.status === 404) {
            console.log("No previous StudentQuiz record found for this quiz.");
            this.payed = false;
            // Ensure these are reset if no studentQuiz record is found
            this.isSubmitted = false;
            this.score = null;
            this.showQuizQuestions = false;
            return of(null);
          }
          console.error("Erreur lors de la récupération des informations de l'étudiant et du quiz :", error);
          return of(null);
        })
      );
    } else {
      console.error("quizId est null. Impossible de charger les informations de l'étudiant et du quiz.");
      return of(null);
    }
  }

  sendPaymentSuccessEmail() {
    const to = this.email;
    const subject = "Payment Confirmation - Quiz Access Granted";
    const htmlContent = `
    <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 10px;">
        <h2 style="color: #2c3e50;">Payment Confirmation</h2>
        <p>Dear <strong>${this.name} ${this.surname}</strong>,</p>
        <p>We are pleased to inform you that your payment has been successfully processed.</p>
        <p>You now have full access to your quiz session. We wish you the best of luck!</p>
        <p>If you have any questions, feel free to contact our support team.</p>
        <hr>
        <p style="color: #777; font-size: 12px; display: flex; justify-content: space-between; align-items: center;">
            <span>Best regards,<br>Your BRAINWAVE Team</span>
            <img src="https://res.cloudinary.com/dxldo1aut/image/upload/v1741208941/xz3ilh7eqgdzqnpcxav9.png" alt="Logo" style="width: 56px; height: auto; margin-left: 10px;">
        </p>
    </div>
    `;

    console.log("Sending email to:", to);
    console.log("Subject:", subject);
    console.log("HTML Content:", htmlContent);

    this.studentQuizService.sendEmail(to, subject, htmlContent).subscribe(
      (response) => {
        console.log("Email sent successfully:", response);
        if (response && response.message) {
          console.log(response.message);
        } else {
          console.warn("Unexpected response format:", response);
        }
      },
      (error) => console.error("Error sending email:", error)
    );
    this.updateEmailStatus();
  }

  loadQuizDetails(): Observable<any> {
    if (this.quizId !== null) {
      return this.quizService.getQuizById(this.quizId).pipe(
        tap(quiz => {
          this.quizDetails = quiz;
          this.quizType = quiz.type;
          if (!this.isValidDuration(quiz.duration)) {
            console.error('La durée du quiz est invalide :', quiz.duration);
            return;
          }
          this.timerSeconds = this.convertDurationToSeconds(quiz.duration);
          if (this.timerSeconds <= 0) {
            console.error('Durée de quiz invalide');
          }
        }),
        catchError(error => {
          console.error('Error loading quiz details:', error);
          return of(null);
        })
      );
    }
    return of(null);
  }

  isValidDuration(duration: string): boolean {
    const regex = /^(\d{2}):(\d{2})$/;
    return regex.test(duration);
  }

  convertDurationToSeconds(duration: string): number {
    if (!duration) return 0;
    const timeParts = duration.split(':');
    if (timeParts.length !== 2) {
      console.error('La durée doit être au format HH:mm');
      return 0;
    }
    const hours = Number(timeParts[0]);
    const minutes = Number(timeParts[1]);
    if (isNaN(hours) || isNaN(minutes)) {
      console.error('Erreur de conversion de la durée', { hours, minutes });
      return 0;
    }
    return (hours * 3600) + (minutes * 60);
  }

  checkAndLoadQuizProgress(): void {
    if (this.quizId === null) return;

    this.studentQuizService.getQuizProgress(this.quizId).subscribe(
      (progress) => {
        if (progress) {
          console.log("Loaded quiz progress:", progress);
          // If quiz is passed, user should have been redirected already by loadStudentQuizInfo
          if (progress.passed) {
            console.log("Quiz already passed, redirecting or showing details.");
            this.score = null; // Ensure score is null on page load
            this.isSubmitted = true; // Mark as submitted to prevent accidental starts
            this.showQuizQuestions = false; // Hide quiz section
            return;
          }

          // If quiz is NOT passed, but there is saved progress
          if (progress.studentResponses) {
            const loadedResponses = progress.studentResponses;
            this.selectedResponses = loadedResponses.selectedResponses || {};
            this.droppedItems = loadedResponses.droppedItems || {};
            this.currentQuestionIndex = loadedResponses.currentQuestionIndex !== undefined ? loadedResponses.currentQuestionIndex : 0;

            if (loadedResponses.initialQuestionOrder) {
              this.initialQuestionOrder = loadedResponses.initialQuestionOrder;
            }
            if (loadedResponses.initialResponseOrders) {
              this.initialResponseOrders = loadedResponses.initialResponseOrders;
            }
            if (loadedResponses.initialDragAndDropOrders) {
              this.initialDragAndDropOrders = loadedResponses.initialDragAndDropOrders;
            }
          }

          if (progress.remainingTime > 0) {
            this.timerSeconds = progress.remainingTime;
          } else {
            // If time is 0 or less, auto-submit unless already submitted
            if (!this.isSubmitted) {
              this.autoSubmitQuiz();
              return;
            }
          }

          // If there's progress, set up to show quiz questions and continue
          if (!this.isSubmitted) {
            this.loadQuestions(true); // Load questions, indicating we're loading from progress
            this.showQuizQuestions = true; // Display quiz questions
            this.quizStarted = true; // Mark quiz as started
            this.startTimer(); // Resume timer
          }
        } else {
          console.log("No previous quiz progress found for this student/quiz. Preparing for a new quiz.");
          this.score = null;
          this.showQuizQuestions = false;
          this.quizStarted = false;
          // The "Take the quiz" button will call loadQuestions(false) to start a new quiz
        }
      },
      (error) => {
        if (error.status === 404) {
          console.log("No saved progress found on server.");
        } else {
          console.error("Error fetching quiz progress:", error);
        }
        // In case of error or no progress, reset state and prepare for new quiz
        this.score = null;
        this.showQuizQuestions = false;
        this.quizStarted = false;
        // The "Take the quiz" button will handle loading questions.
      }
    );
  }

  saveQuizProgress(): void {
    if (this.quizId === null || !this.quizStarted || this.isSubmitted) {
      return;
    }

    const studentResponses = {
      selectedResponses: this.selectedResponses,
      droppedItems: this.droppedItems,
      currentQuestionIndex: this.currentQuestionIndex,
      initialQuestionOrder: this.questions.map(q => q.idQuestion),
      initialResponseOrders: this.initialResponseOrders,
      initialDragAndDropOrders: this.initialDragAndDropOrders
    };

    this.studentQuizService.saveQuizProgress(this.quizId, studentResponses, this.timerSeconds).subscribe(
      response => {
        console.log('Quiz progress saved:', response);
      },
      error => {
        console.error('Error saving quiz progress:', error);
      }
    );
  }

  loadQuestions(fromProgress: boolean): void {
    if (this.quizId !== null) {
      this.questionService.getListQuestionsByQuizId(this.quizId).subscribe(questions => {
        let processedQuestions: Question[] = [];

        if (fromProgress && this.initialQuestionOrder.length > 0) {
          processedQuestions = this.initialQuestionOrder
            .map(id => questions.find(q => q.idQuestion === id))
            .filter((q): q is Question => q !== undefined);
        } else {
          processedQuestions = this.shuffleArray(questions);
          this.initialQuestionOrder = processedQuestions.map(q => q.idQuestion);
        }

        const requests: Observable<any>[] = processedQuestions.map(question => {
          let responsesObservable: Observable<any[]>;
          if (question.type === 'MULTIPLE_CHOICE') {
            responsesObservable = this.responseService.getListResponsesByQuestionId(question.idQuestion).pipe(
              map(responses => {
                if (fromProgress && this.initialResponseOrders[question.idQuestion]) {
                  return this.initialResponseOrders[question.idQuestion]
                    .map(id => responses.find(r => r.idResponse === id))
                    .filter((r): r is any => r !== undefined);
                } else {
                  const shuffled = this.shuffleArray(responses);
                  this.initialResponseOrders[question.idQuestion] = shuffled.map(r => r.idResponse);
                  return shuffled;
                }
              })
            );
          } else if (question.type === 'DRAG_AND_DROP') {
            responsesObservable = this.responseService.getListDragAndDropByQuestionId(question.idQuestion).pipe(
              map(dragAndDropPairs => {
                if (fromProgress && this.initialDragAndDropOrders[question.idQuestion]) {
                  return this.initialDragAndDropOrders[question.idQuestion]
                    .map(id => dragAndDropPairs.find(p => p.idDragAndDrop === id))
                    .filter((p): p is DragAndDropPair => p !== undefined);
                } else {
                  const shuffled = this.shuffleArray(dragAndDropPairs);
                  this.initialDragAndDropOrders[question.idQuestion] = shuffled.map(p => p.idDragAndDrop);
                  return shuffled;
                }
              })
            );
          } else {
            responsesObservable = this.responseService.getListResponsesByQuestionId(question.idQuestion).pipe(
              map(responses => {
                if (fromProgress && this.initialResponseOrders[question.idQuestion]) {
                    return this.initialResponseOrders[question.idQuestion]
                        .map(id => responses.find(r => r.idResponse === id))
                        .filter((r): r is any => r !== undefined);
                }
                return responses;
              })
            );
          }
          return responsesObservable.pipe(
            map(res => {
              if (question.type === 'DRAG_AND_DROP') {
                return { ...question, dragAndDropPairs: res };
              } else {
                return { ...question, responses: res };
              }
            })
          );
        });

        forkJoin(requests).subscribe(completeQuestions => {
          this.questions = completeQuestions;
          this.questions.forEach(question => {
            if (question.dragAndDropPairs) {
              this.dragAndDropPairs[question.idQuestion] = question.dragAndDropPairs;
              if (fromProgress) {
                  const droppedIds = Object.keys(this.droppedItems)
                    .filter(key => key.startsWith(question.idQuestion + '-'))
                    .map(key => this.droppedItems[key].idDragAndDrop);

                  this.shuffledDragAndDropPairs[question.idQuestion] = question.dragAndDropPairs.filter(
                      pair => !droppedIds.includes(pair.idDragAndDrop)
                  );
              } else {
                  this.shuffledDragAndDropPairs[question.idQuestion] = this.shuffleArray(JSON.parse(JSON.stringify(question.dragAndDropPairs)));
              }
            }
          });
          this.showQuizQuestions = true; // Show quiz questions only now
          if (!this.quizStarted && this.timerSeconds > 0) {
            this.quizStarted = true;
            this.startTimer();
          } else if (this.quizStarted && this.timerSeconds <= 0 && !this.isSubmitted) {
            this.autoSubmitQuiz();
          }
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
    event.dataTransfer?.setData('text/plain', pair.idDragAndDrop.toString());
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    const target = event.target as HTMLElement;
    if (target.classList.contains('drop-item')) {
      target.classList.add('highlight');
    }
  }

  onDrop(event: DragEvent, questionId: number, pairId: number) {
    event.preventDefault();
    const draggedPairId = event.dataTransfer?.getData('text/plain');
    const draggedPair = this.dragAndDropPairs[questionId].find(pair => pair.idDragAndDrop === Number(draggedPairId));
    if (draggedPair) {
      this.droppedItems[questionId + '-' + pairId] = draggedPair;
      const index = this.shuffledDragAndDropPairs[questionId].findIndex(p => p.idDragAndDrop === Number(draggedPairId));
      if (index !== -1) {
        this.shuffledDragAndDropPairs[questionId].splice(index, 1);
      }
      this.shuffledDragAndDropPairs = { ...this.shuffledDragAndDropPairs };
      this.droppedItems = { ...this.droppedItems };
      this.saveQuizProgress();
    }
  }

  trackByPair(index: number, pair: DragAndDropPair): number {
    return pair.idDragAndDrop;
  }

  resetDrop(questionId: number, pairId: number) {
    const droppedPair = this.droppedItems[questionId + '-' + pairId];
    if (droppedPair) {
      if (!this.shuffledDragAndDropPairs[questionId]) {
        this.shuffledDragAndDropPairs[questionId] = [];
      }
      this.shuffledDragAndDropPairs[questionId].push(droppedPair);
      delete this.droppedItems[questionId + '-' + pairId];
      this.shuffledDragAndDropPairs = { ...this.shuffledDragAndDropPairs };
      this.droppedItems = { ...this.droppedItems };
      this.saveQuizProgress();
    }
  }

  startTimer(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    this.intervalId = setInterval(() => {
      if (this.timerSeconds > 0) {
        this.timerSeconds--;
      } else {
        if (this.quizStarted && !this.isSubmitted) {
          this.autoSubmitQuiz();
        } else {
          console.warn("Timer expired, but quiz not started or already submitted. No auto-submission.");
        }
        clearInterval(this.intervalId);
      }
    }, 1000);
  }

  nextQuestion(): void {
    this.saveQuizProgress();
    if (this.currentQuestionIndex < this.questions.length - 1) {
      this.currentQuestionIndex++;
    }
  }

  prevQuestion(): void {
    this.saveQuizProgress();
    if (this.currentQuestionIndex > 0) {
      this.currentQuestionIndex--;
    }
  }

  onResponseSelect(questionId: number, responseId: number): void {
    this.selectedResponses[questionId] = responseId;
    this.saveQuizProgress();
  }

  autoSubmitQuiz(): void {
    if (this.isSubmitted) return;
    console.log("Auto-submitting quiz due to timer or tab change.");

    for (let question of this.questions) {
      if (question.type === 'MULTIPLE_CHOICE' && this.selectedResponses[question.idQuestion] === undefined) {
        this.selectedResponses[question.idQuestion] = -1;
      }
    }
    this.submitQuiz(true); // Indicate auto-submission
  }

  hasAnsweredAllDragAndDrop(): boolean {
    for (const question of this.questions) {
      if (question.type === 'DRAG_AND_DROP') {
        if (!this.dragAndDropPairs[question.idQuestion]) {
          return false;
        }
        const requiredDrops = this.dragAndDropPairs[question.idQuestion].length;
        let actualDrops = 0;
        for (const pair of this.dragAndDropPairs[question.idQuestion]) {
            if (this.droppedItems[question.idQuestion + '-' + pair.idDragAndDrop]) {
                actualDrops++;
            }
        }
        if (actualDrops !== requiredDrops) {
            return false;
        }
      }
    }
    return true;
  }

  hasAnsweredAllMultipleChoice(): boolean {
    for (const question of this.questions) {
      if (question.type === 'MULTIPLE_CHOICE' && this.selectedResponses[question.idQuestion] === undefined) {
        return false;
      }
    }
    return true;
  }

  isQuizComplete(): boolean {
    return this.hasAnsweredAllDragAndDrop() && this.hasAnsweredAllMultipleChoice();
  }

  submitQuiz(isAutoSubmit: boolean = false): void {
    if (!isAutoSubmit && !this.isQuizComplete()) {
      alert('Please answer all questions before submitting the quiz.');
      return;
    }

    if (this.isSubmitted) return;
    this.isSubmitted = true; // Mark as submitted
    clearInterval(this.intervalId);

    const responsesToSubmit: { questionId: number, response: any, responseType: string }[] = [];

    for (const question of this.questions) {
      let response: any;
      let responseType: string;

      if (question.type === 'DRAG_AND_DROP') {
        const dragAndDropResponses: { [key: string]: { sourceText: string, targetText: string } } = {};
        if (this.dragAndDropPairs[question.idQuestion]) {
          for (const pair of this.dragAndDropPairs[question.idQuestion]) {
            const droppedPair = this.droppedItems[question.idQuestion + '-' + pair.idDragAndDrop];
            dragAndDropResponses[question.idQuestion + '-' + pair.idDragAndDrop] = {
              sourceText: droppedPair ? droppedPair.sourceText : '',
              targetText: droppedPair ? droppedPair.targetText : ''
            };
          }
        }
        response = dragAndDropResponses;
        responseType = 'DRAG_AND_DROP';
      } else if (question.type === 'MULTIPLE_CHOICE') {
        response = this.selectedResponses[question.idQuestion];
        if (response === undefined) {
          response = -1;
        }
        responseType = 'MULTIPLE_CHOICE';
      } else {
        response = null;
        responseType = question.type || 'UNKNOWN';
      }

      responsesToSubmit.push({
        questionId: question.idQuestion,
        response: response,
        responseType: responseType,
      });
    }

    console.log('Réponses envoyées au serveur:', responsesToSubmit);

    if (this.quizId !== null) {
      this.studentQuizService.evaluateQuiz(this.quizId, responsesToSubmit).subscribe(
        (score) => {
          this.score = score; // Set score only after successful submission
          this.showQuizQuestions = false; // Hide quiz, show score
          // If you want to clear saved progress after submission, you could do it here
          // For example: this.studentQuizService.clearQuizProgress(this.quizId).subscribe();
        },
        (error) => {
          console.error("Erreur lors de l'évaluation du quiz:", error);
          alert("Error evaluating quiz. Please try again.");
          this.isSubmitted = false; // Allow re-submission if evaluation fails
        }
      );
    }
  }

  getScoreColor(): string {
    if (this.score !== null) {
      if (this.score >= 50) {
        return '#2ecc71';
      } else {
        return '#e74c3c';
      }
    } else {
      return '#bdc3c7';
    }
  }

  formatTimeWithSeconds(seconds: number): string {
    if (isNaN(seconds)) {
      console.error('Timer invalide:', seconds);
      return '00:00:00';
    }
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${this.padZero(hours)}:${this.padZero(minutes)}:${this.padZero(remainingSeconds)}`;
  }

  padZero(num: number): string {
    return num < 10 ? '0' + num : num.toString();
  }

  downloadCertificate(): void {
    const doc = new jsPDF();
    let imgWidth = 210;
    let imgHeight = (496 / 690) * imgWidth;
    if (imgHeight > 297) {
        imgHeight = 297;
        imgWidth = (690 / 496) * imgHeight;
    }
    let x = (210 - imgWidth) / 2;
    let y = (297 - imgHeight) / 2;
    doc.addImage('assets/certificate-background.png', 'PNG', x, y, imgWidth, imgHeight);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(13);
    doc.text(`This is to certify that`, 60, 154, { align: "center" });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(`${this.name} ${this.surname}`, 70, 164, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(13);
    doc.text(`has successfully completed the quiz`, 100, 174, { align: "center" });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(`${this.quizDetails?.titleQuiz}`, 110, 182, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(14);
    doc.text(`With a score of ${this.score}%`, 160, 190, { align: "center" });

    doc.save(`Certificat_${this.name}_${this.surname}.pdf`);
  }

  reloadPage(): void {
    window.location.reload();
  }

  goBack(): void {
  this.router.navigate(['/courses']);
  }
}