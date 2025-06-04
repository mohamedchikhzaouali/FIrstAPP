import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ValidatorFn, AbstractControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { QuizService } from 'src/app/services/QuizServices/quiz.service';
import { Quiz } from 'src/app/Model/QuizModel/quiz';

@Component({
  selector: 'app-update-quiz',
  templateUrl: './update-quiz.component.html',
  styleUrls: ['./update-quiz.component.scss']
})
export class UpdateQuizComponent implements OnInit {
  updateQuizForm: FormGroup;
  quizId: number | null = null;
  quizTypes = ['CERTIFIED_QUIZ', 'TRAINING_QUIZ'];

  constructor(
    private fb: FormBuilder,
    private quizService: QuizService,
    private route: ActivatedRoute,
    private router: Router,
    private location: Location // Injecter le service Location
  ) {
    this.updateQuizForm = this.fb.group({
      type: ['', Validators.required],
      titleQuiz: ['', Validators.required],
      duration: ['', [Validators.pattern(/^([0-1]\d|2[0-3]):([0-5]\d)$/), this.minDurationValidator]],
      startDate: [''],
      endDate: [''],
      price: ['', this.priceValidator]
    }, { validators: this.dateRangeValidator });
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
      this.updateQuizForm.get('price')?.setValue(input.value);
    } else {
      this.updateQuizForm.get('price')?.setValue(value);
    }
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

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const idParam = params.get('quizId');
      if (idParam) {
        this.quizId = +idParam;
        if (!isNaN(this.quizId)) {
          this.loadQuiz(this.quizId);
        } else {
          console.error("ID de quiz invalide");
          this.router.navigate(['/quizzes']);
        }
      }
    });
  }

  loadQuiz(id: number): void {
    this.quizService.getQuizById(id).subscribe({
      next: (quiz: Quiz) => {
        console.log("Quiz chargé:", quiz);
        this.updateQuizForm.patchValue({
          type: quiz.type || 'CERTIFIED_QUIZ', // Default to CERTIFIED_QUIZ if type is null
          titleQuiz: quiz.titleQuiz,
          duration: quiz.duration,
          startDate: this.formatDateForInput(quiz.startDate),
          endDate: this.formatDateForInput(quiz.endDate),
          price: quiz.price
        });
        this.onQuizTypeChange(); // Call onQuizTypeChange after loading to adjust fields
      },
      error: err => console.error("Erreur lors du chargement du quiz", err)
    });
  }

  formatDateForInput(date: string | Date | null): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().slice(0, 16);
  }

  onQuizTypeChange(): void {
    const selectedType = this.updateQuizForm.get('type')?.value;
    if (selectedType === 'TRAINING_QUIZ') {
      this.updateQuizForm.get('duration')?.clearValidators();
      this.updateQuizForm.get('startDate')?.clearValidators();
      this.updateQuizForm.get('endDate')?.clearValidators();
      this.updateQuizForm.get('price')?.clearValidators();
    } else if (selectedType === 'CERTIFIED_QUIZ') {
      this.updateQuizForm.get('duration')?.setValidators([Validators.required, Validators.pattern(/^([0-1]\d|2[0-3]):([0-5]\d)$/), this.minDurationValidator]);
      this.updateQuizForm.get('startDate')?.setValidators([Validators.required]);
      this.updateQuizForm.get('endDate')?.setValidators([Validators.required]);
      this.updateQuizForm.get('price')?.setValidators([Validators.required, this.priceValidator]);
    }
    this.updateQuizForm.get('duration')?.updateValueAndValidity();
    this.updateQuizForm.get('startDate')?.updateValueAndValidity();
    this.updateQuizForm.get('endDate')?.updateValueAndValidity();
    this.updateQuizForm.get('price')?.updateValueAndValidity();
  }

  updateQuiz(): void {
    if (this.updateQuizForm.valid && this.quizId !== null) {
      const formValue = this.updateQuizForm.value;
      const updatedQuiz: any = {
        id: this.quizId,
        type: formValue.type,
        titleQuiz: formValue.titleQuiz,
        duration: formValue.duration,
        startDate: formValue.startDate ? new Date(formValue.startDate).toISOString().split('.')[0] : null,
        endDate: formValue.endDate ? new Date(formValue.endDate).toISOString().split('.')[0] : null,
        price: formValue.price
      };
      console.log("Données envoyées :", updatedQuiz);
      this.quizService.updateQuiz(this.quizId, updatedQuiz).subscribe({
        next: () => {
          console.log("Quiz mis à jour avec succès");
          this.router.navigate(['/quizzes']);
        },
        error: err => {
          console.error("Erreur lors de la mise à jour du quiz", err);
          alert("Erreur lors de la mise à jour");
        }
      });
    }
  }

  goBack(): void {
    this.location.back(); // Utiliser location.back()
  }
}