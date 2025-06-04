import { Component, OnInit } from '@angular/core';
 import { Router, ActivatedRoute } from '@angular/router';
 import { FormBuilder, FormGroup, Validators, ValidatorFn, AbstractControl, FormArray } from '@angular/forms';
 import { QuizService } from 'src/app/services/QuizServices/quiz.service';
 import { Quiz } from 'src/app/Model/QuizModel/quiz';
 import { switchMap } from 'rxjs/operators';
 import { of } from 'rxjs';

 @Component({
  selector: 'app-add-quiz',
  templateUrl: './add-quiz.component.html',
  styleUrls: ['./add-quiz.component.scss']
 })
 export class AddQuizComponent implements OnInit {
  courseId!: number;
  quizForm: FormGroup;
  quizTypes = ['CERTIFIED_QUIZ', 'TRAINING_QUIZ'];

  constructor(
  private fb: FormBuilder,
  private quizService: QuizService,
  private router: Router,
  private route: ActivatedRoute
  ) {
  this.quizForm = this.fb.group({
  quizzesArray: this.fb.array([])
  });
  this.addAnotherQuiz(); // Ajouter un premier formulaire de quiz
  }

  ngOnInit(): void {
  // Get the courseId from the route parameters
  this.route.params.subscribe(params => {
  this.courseId = +params['courseId']; // Assuming your route is something like /courses/:courseId/add-quiz
  if (!this.courseId) {
  // Handle the case where courseId is not available (e.g., redirect or display an error)
  console.error('Course ID not found in the route.');
  }
  });
  }

  get quizzesArray(): FormArray {
  return this.quizForm.get('quizzesArray') as FormArray;
  }

  newQuizForm(type: string = 'CERTIFIED_QUIZ'): FormGroup {
  const now = new Date();
  const formattedNow = now.toISOString().slice(0, 16);

  if (type === 'CERTIFIED_QUIZ') {
  return this.fb.group({
  type: [type, Validators.required],
  titleQuiz: ['', Validators.required],
  duration: ['', [Validators.required, Validators.pattern(/^([0-1]\d|2[0-3]):([0-5]\d)$/), this.minDurationValidator]],
  startDate: [formattedNow, Validators.required],
  endDate: [formattedNow, Validators.required],
  price: ['', [Validators.required, this.priceValidator, Validators.min(1)]]  }, { validators: this.dateRangeValidator });
  } else if (type === 'TRAINING_QUIZ') {
  return this.fb.group({
  type: [type, Validators.required],
  titleQuiz: ['', Validators.required],
  duration: [null],
  startDate: [null],
  endDate: [null],
  price: [null]
  });
  }
  return this.fb.group({ // Fallback
  type: [type, Validators.required],
  titleQuiz: ['', Validators.required],
  duration: [null],
  startDate: [null],
  endDate: [null],
  price: [null]
  });
  }

  onQuizTypeChange(index: number): void {
  const quizGroup = this.quizzesArray.controls[index] as FormGroup;
  const selectedType = quizGroup.get('type')?.value;
  this.quizzesArray.setControl(index, this.newQuizForm(selectedType));
  }

  priceValidator: ValidatorFn = (control: AbstractControl): { [key: string]: any } | null => {
  const value = control.value;
  if (value) {
  const regex = /^\d+(\.\d{1,2})?$/; // Accepte les chiffres et un seul point
  if (!regex.test(value)) {
  return { 'invalidPrice': true };
  }
  }
  return null;
  };

  onPriceInput(event: any) {
  const input = event.target as HTMLInputElement;
  let value = input.value;
  const regex = /^\d*(\.\d{0,2})?$/;

  // Vérifie si la valeur actuelle est valide
  if (!regex.test(value)) {
  // Si la valeur n'est pas valide, corrige-la
  const validValue = value.replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1');
  input.value = validValue;
  value = validValue; // Met à jour la valeur pour les vérifications suivantes
  }

  // Vérifie si l'utilisateur a déjà saisi deux chiffres après la virgule
  const dotIndex = value.indexOf('.');
  if (dotIndex !== -1 && value.length > dotIndex + 3) {
  // Si oui, tronque la valeur à deux chiffres après la virgule
  input.value = value.substring(0, dotIndex + 3);
  this.quizzesArray.controls[this.getControlIndex(input)].get('price')?.setValue(input.value);
  } else {
  this.quizzesArray.controls[this.getControlIndex(input)].get('price')?.setValue(value);
  }
  }

  getControlIndex(element: HTMLInputElement): number {
  const formGroupName = (element.closest('.response-container') as HTMLElement)?.getAttribute('formGroupName');
  return formGroupName ? parseInt(formGroupName, 10) : -1;
  }

  minDurationValidator: ValidatorFn = (control: AbstractControl): { [key: string]: any } | null => {
  const duration = control.value;
  if (duration) {
  const [hours, minutes] = duration.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes;
  if (totalMinutes < 1) {
  return { 'minDuration': true };
  }
  }
  return null;
  };

  dateRangeValidator: ValidatorFn = (control: AbstractControl): { [key: string]: any } | null => {
  const formGroup = control as FormGroup;
  const startDate = formGroup.get('startDate')?.value;
  const endDate = formGroup.get('endDate')?.value;

  if (startDate && endDate) {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const diff = end - start;
  const oneHour = 60 * 60 * 1000;

  if (diff < oneHour && diff !== oneHour) {
  return { 'dateRange': { message: 'La date de fin doit être supérieure à la date de début d\'au moins une heure.' } };
  }
  }
  return null;
  };

  addAnotherQuiz(): void {
  this.quizzesArray.push(this.newQuizForm());
  }

  removeQuiz(index: number): void {
  this.quizzesArray.removeAt(index);
  }

  addQuizzes(): void {
  if (this.quizForm.valid && this.courseId) {
  // Use switchMap to chain the quizService.addQuiz calls and handle responses
  of(...this.quizzesArray.controls).pipe(
  switchMap(control => {
  const quizData: Quiz = {
  ...control.value,
  startDate: control.value.startDate ? new Date(control.value.startDate).toISOString().split('.')[0] : null,
  endDate: control.value.endDate ? new Date(control.value.endDate).toISOString().split('.')[0] : null,
  };
  return this.quizService.addQuiz(quizData, this.courseId);
  })
  ).subscribe({
  next: (response) => {
  console.log('Quiz added successfully', response);
  },
  error: (err) => {
  console.error("Error adding quiz...", err);
  alert("Erreur lors de l'ajout du quiz");
  },
  complete: () => {
  this.router.navigate(['/quizzes', this.courseId]); // Navigate after all quizzes are added
  }
  });
  } else {
  console.error('Form is invalid or Course ID is missing.');
  // Optionally, display validation errors to the user
  }
  }

  goBack(): void {
  this.router.navigate(['/quizzes', this.courseId]);
  }
 }