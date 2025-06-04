import { Component, OnInit } from '@angular/core';
 import { QuizService } from 'src/app/services/QuizServices/quiz.service';
 import { QuestionService } from 'src/app/services/QuizServices/question.service';
 import { Quiz } from 'src/app/Model/QuizModel/quiz';
 import { Response } from 'src/app/Model/QuizModel/response';
 import Swal from 'sweetalert2';
 import { AuthService } from 'src/app/AuthService';
 import { Observable, Subscription } from 'rxjs'; // Importez Observable et Subscription
 import { ActivatedRoute } from '@angular/router'; // Import ActivatedRoute

 @Component({
  selector: 'app-quiz',
  templateUrl: './quiz.component.html',
  styleUrls: ['./quiz.component.scss'],
 })
 export class QuizComponent implements OnInit {
  userRole$: Observable<string | null>;

  quizzes: Quiz[] = [];
  filteredQuizzes: Quiz[] = [];
  searchTerm: string = '';
  courseId: number | null = null; // To store the course ID

  constructor(
  private quizService: QuizService,
  private questionService: QuestionService,
  private authService: AuthService,
  private route: ActivatedRoute // Inject ActivatedRoute
  ) {
  this.userRole$ = this.authService.userRole$;
  }

  ngOnInit(): void {
  this.userRole$.subscribe(role => {
  console.log('Rôle actuel (AppComponent):', role);
  });

  // Get the course ID from the route
  this.route.params.subscribe(params => {
  this.courseId = +params['courseId']; // Convert to number
  if (this.courseId !== null && this.courseId !== undefined) {
  this.loadQuizzesForCourse(this.courseId);
  } else {
  this.loadQuizzes(); // Optionally load all quizzes or handle the case where there's no courseId
  }
  });
  }

  loadQuizzes(): void {
  // Potentially load all quizzes if no courseId is available
  // this.quizService.getAllQuizzes().subscribe((data) => {
  //   this.quizzes = data;
  //   this.filteredQuizzes = data;
  // });
  this.quizzes = [];
  this.filteredQuizzes = [];
  console.warn('No course ID provided, not loading quizzes.');
  }

  loadQuizzesForCourse(courseId: number): void {
  this.quizService.getAllQuizzesByCourseId(courseId).subscribe(data => {
  this.quizzes = data;
  this.filteredQuizzes = data;
  });
  }

  deleteQuiz(id: number): void {
  Swal.fire({
  title: 'Êtes-vous sûr ?',
  text: 'Cette action est irréversible !',
  icon: 'warning',
  showCancelButton: true,
  confirmButtonText: 'Oui, supprimer',
  cancelButtonText: 'Annuler'
  }).then((result) => {
  if (result.isConfirmed) {
  this.quizService.deleteQuiz(id).subscribe({
  next: (message) => {
  Swal.fire('Supprimé !', message, 'success');
  if (this.courseId) {
  this.loadQuizzesForCourse(this.courseId);
  } else {
  this.loadQuizzes();
  }
  },
  error: (err) => {
  Swal.fire('Erreur !', 'Une erreur est survenue.', 'error');
  console.error("Erreur lors de la suppression :", err);
  }
  });
  }
  });
  }

  deleteQuestion(questionId: number): void {
  this.quizService.deleteQuestion(questionId).subscribe(() => {
  if (this.courseId) {
  this.loadQuizzesForCourse(this.courseId);
  } else {
  this.loadQuizzes();
  }
  });
  }

  addResponse(questionId: number, response: Response): void {
  this.quizService.addResponse(questionId, response).subscribe(() => {
  if (this.courseId) {
  this.loadQuizzesForCourse(this.courseId);
  } else {
  this.loadQuizzes();
  }
  });
  }

  deleteResponse(responseId: number): void {
  this.quizService.deleteResponse(responseId).subscribe(() => {
  if (this.courseId) {
  this.loadQuizzesForCourse(this.courseId);
  } else {
  this.loadQuizzes();
  }
  });
  }

  filterQuizzes(): void {
  const term = this.searchTerm.toLowerCase().trim();

  if (term === '') {
  this.filteredQuizzes = [...this.quizzes];
  return;
  }

  this.filteredQuizzes = this.quizzes.filter(quiz => {
  return Object.entries(quiz).some(([key, value]) => {
  if (key === 'idQuiz') return false;
  if (value === null || value === undefined) return false;

  let stringValue = value.toString().toLowerCase();

  if (value instanceof Date || (typeof value === 'string' && value.includes('T'))) {
  try {
  const date = new Date(value);

  const formattedDate = new Intl.DateTimeFormat('fr-FR', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  }).format(date).toLowerCase();

  const formattedTime = new Intl.DateTimeFormat('fr-FR', {
  hour: '2-digit',
  minute: '2-digit'
  }).format(date).toLowerCase();

  const fullFormattedDate = `${formattedDate} ${formattedTime}`;

  return (
  formattedDate.includes(term) ||
  formattedTime.includes(term) ||
  fullFormattedDate.includes(term)
  );
  } catch (error) {
  console.error("Erreur de conversion de date :", error);
  }
  }

  return stringValue.includes(term);
  });
  });
  }
 }