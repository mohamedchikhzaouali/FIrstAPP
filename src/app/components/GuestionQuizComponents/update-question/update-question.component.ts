import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { QuestionService } from 'src/app/services/QuizServices/question.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Question } from 'src/app/Model/QuizModel/question';
import { Location } from '@angular/common';

@Component({
  selector: 'app-update-question',
  templateUrl: './update-question.component.html',
  styleUrls: ['./update-question.component.scss']
})
export class UpdateQuestionComponent implements OnInit {
  updateQuestionForm: FormGroup;
  questionId: number | null = null;
  quizId: number | null = null;
  currentImageUrl: string | null = null; // Pour afficher l'image actuelle

  constructor(
    private fb: FormBuilder,
    private questionService: QuestionService,
    private route: ActivatedRoute,
    private router: Router,
    private location: Location // Injecter le service Location
  ) {
    this.updateQuestionForm = this.fb.group({
      question: ['', Validators.required],
      image: [null] // Champ pour l'image
    });
  }

  ngOnInit(): void {
    // Récupérer l'ID de la question et l'ID du quiz depuis l'URL
    this.route.paramMap.subscribe(params => {
      this.questionId = Number(params.get('id'));
      this.quizId = Number(params.get('quizId'));

      if (!isNaN(this.questionId) && !isNaN(this.quizId)) {
        this.loadQuestion(this.questionId);
      } else {
        console.error("ID de question ou quiz invalide");
        this.router.navigate(['/quiz']);
      }
    });
  }

  loadQuestion(id: number): void {
    this.questionService.getQuestionById(id).subscribe({
      next: (question: Question) => {
        this.updateQuestionForm.patchValue({
          question: question.question
        });

        // Vérification et assignation de l'image actuelle
        this.currentImageUrl = question.questionPictureUrl 
          ? `${question.questionPictureUrl}` 
          : null;
      },
      error: err => console.error("Erreur lors du chargement de la question", err)
    });
  }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.updateQuestionForm.patchValue({ image: file });
      this.updateQuestionForm.get('image')?.updateValueAndValidity();
    }
  }

  updateQuestion(): void {
    if (this.updateQuestionForm.valid && this.questionId !== null) {
      const formValue = this.updateQuestionForm.value;
      const updatedQuestion = new FormData();
  
      // 🔹 Convertir l'objet en JSON string
      const questionJson = JSON.stringify({ question: formValue.question });
  
      updatedQuestion.append('question', questionJson); // ✅ Envoyer en JSON
      updatedQuestion.append('id', String(this.questionId));
  
      if (formValue.image && formValue.image instanceof File) {
        updatedQuestion.append('file', formValue.image, formValue.image.name);
      }
  
      this.questionService.updateQuestion(this.questionId, updatedQuestion).subscribe({
        next: () => {
          console.log("✅ Question mise à jour avec succès");
          this.router.navigate(['/questions', this.quizId]);
        },
        error: err => {
          console.error("❌ Erreur lors de la mise à jour de la question", err);
          alert("Erreur lors de la mise à jour");
        }
      });
    }
  }

  goBack(): void {
    this.location.back(); // Utiliser location.back()
  }
}