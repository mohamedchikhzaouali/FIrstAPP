import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { QuestionService } from 'src/app/services/QuizServices/question.service';
import { Question } from 'src/app/Model/QuizModel/question';
import { Location } from '@angular/common';


@Component({
  selector: 'app-add-question',
  templateUrl: './add-question.component.html',
  styleUrls: ['./add-question.component.scss']
})
export class AddQuestionComponent implements OnInit {
  addQuestionForm: FormGroup;
  quizId: number | null = null;
  selectedFiles: (File | null)[] = []; // Correction ici
  questionTypes = ['MULTIPLE_CHOICE', 'DRAG_AND_DROP'];

  constructor(
    private fb: FormBuilder,
    private questionService: QuestionService,
    private route: ActivatedRoute,
    private router: Router,
    private location: Location // Injecter le service Location
  ) {
    this.addQuestionForm = this.fb.group({
      questionsArray: this.fb.array([])
    });
    this.addAnotherQuestion();
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.quizId = +params.get('quizId')!;
      console.log('Quiz ID:', this.quizId);
    });
  }

  get questionsArray(): FormArray {
    return this.addQuestionForm.get('questionsArray') as FormArray;
  }

  newQuestionForm(): FormGroup {
    return this.fb.group({
      question: ['', Validators.required],
      type: ['', Validators.required],
      file: [null]
    });
  }

  addAnotherQuestion(): void {
    this.questionsArray.push(this.newQuestionForm());
    this.selectedFiles.push(null);
  }

  removeQuestion(index: number): void {
    this.questionsArray.removeAt(index);
    this.selectedFiles.splice(index, 1);
  }

  onFileSelected(event: any, index: number): void {
    if (event.target.files.length > 0) {
      this.selectedFiles[index] = event.target.files[0];
    }
  }

  addQuestions(): void {
    if (this.addQuestionForm.valid && this.quizId !== null) {
      const questionsArray = this.questionsArray.controls;
  
      questionsArray.forEach((questionForm, index) => {
        const formData = new FormData();
  
        const questionData = {
          question: questionForm.value.question,
          type: questionForm.value.type
        };
        formData.append('question', JSON.stringify(questionData));
  
        if (this.selectedFiles[index] !== null && this.selectedFiles[index] !== undefined) {
          formData.append('file', this.selectedFiles[index]!);
        }
  
        this.questionService.addQuestion(this.quizId!, formData).subscribe({
          next: (response) => {
            console.log('Question ajoutée avec succès', response);
            if (index === questionsArray.length - 1) {
              this.router.navigate(['/questions', this.quizId]);
            }
          },
          error: (err) => {
            console.error("Erreur lors de l'ajout de la question", err);
            alert("Erreur lors de l'ajout de la question");
          }
        });
      });
    }
  }

  goBack(): void {
    this.location.back(); // Utiliser location.back()
  }
}