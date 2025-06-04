import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ResponseService } from 'src/app/services/QuizServices/response.service';
import { Response } from 'src/app/Model/QuizModel/response';
import { QuestionService } from 'src/app/services/QuizServices/question.service';
import { Question } from 'src/app/Model/QuizModel/question';
import { DragAndDropPair } from 'src/app/Model/QuizModel/dragAndDropPair';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-add-response',
  templateUrl: './add-response.component.html',
  styleUrls: ['./add-response.component.scss']
})
export class AddResponseComponent implements OnInit, OnDestroy {
  addResponseForm: FormGroup;
  questionId!: number;
  questionType: string = '';
  responses: Response[] = [];
  errorMessage: string = '';
  formSubscriptions: Subscription[] = [];
  isAddButtonDisabled: boolean = true;
  question: Question | undefined;

  constructor(
    private fb: FormBuilder,
    private responseService: ResponseService,
    private questionService: QuestionService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.addResponseForm = this.fb.group({
      responsesArray: this.fb.array([])
    });
    this.addAnotherResponse();
  }

  goBack(): void {
    this.router.navigate(['/responses', this.questionId]);
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.questionId = +params.get('idQuestion')!;
      this.getQuestion();
      this.getQuestionType();
      this.loadResponses();
    });
    this.subscribeToFormChanges();
  }

  ngOnDestroy(): void {
    this.formSubscriptions.forEach(sub => sub.unsubscribe());
  }

  getQuestionType(): void {
    this.questionService.getQuestionById(this.questionId!).subscribe((question: Question) => {
      this.questionType = question.type;
    });
  }

  getQuestion(): void {
    this.questionService.getQuestionById(this.questionId!).subscribe((question: Question) => {
        this.question = question;
        this.questionType = question.type;
    });
}

  loadResponses(): void {
    if (this.questionType === 'MULTIPLE_CHOICE') {
      this.responseService.getListResponsesByQuestionId(this.questionId).subscribe(responses => {
        this.responses = responses;
      });
    }
  }

  get responsesArray(): FormArray {
    return this.addResponseForm.get('responsesArray') as FormArray;
  }

  subscribeToFormChanges(): void {
  this.formSubscriptions.push(this.responsesArray.valueChanges.subscribe(() => {
    this.isAddButtonDisabled = !this.responsesArray.controls.every(control => {
      if (this.questionType === 'DRAG_AND_DROP') {
        return control.get('sourceText')?.value && control.get('targetText')?.value;
      } else {
        return control.get('response')?.value;
      }
    });
  }));
    this.isAddButtonDisabled = !this.responsesArray.controls.every(control => {
      if (this.questionType === 'DRAG_AND_DROP') {
        return control.get('sourceText')?.value && control.get('targetText')?.value;
      } else {
        return control.get('response')?.value;
      }
    });
}

  newResponseForm(): FormGroup {
    let formGroup: any = {
      response: ['', Validators.required],
      responseCorrect: [false, Validators.required],
    };

    if (this.questionType === 'DRAG_AND_DROP') {
      formGroup.sourceText = ['', Validators.required];
      formGroup.targetText = ['', Validators.required];
    } else {
      formGroup.sourceText = [''];
      formGroup.targetText = [''];
    }

    return this.fb.group(formGroup);
  }

  addAnotherResponse(): void {
    this.responsesArray.push(this.newResponseForm());
  }

  removeResponse(index: number): void {
    this.responsesArray.removeAt(index);
  }

  validateCorrectResponses(): boolean {
    const correctResponses = this.responsesArray.controls.filter(control => control.value.responseCorrect);
    if (correctResponses.length > 1) {
      this.errorMessage = 'Une seule réponse correcte est autorisée.';
      return false;
    }
    this.errorMessage = '';
    return true;
  }

  addResponse(): void {
    if (!this.validateCorrectResponses()) {
      return;
    }
  
    this.errorMessage = '';
    const responsesToAdd: Response[] = [];
    const dragAndDropPairsToAdd: DragAndDropPair[] = [];
  
    // Vérifier si une réponse correcte existe déjà dans la base de données
    if (this.questionType === 'MULTIPLE_CHOICE') {
      this.responseService.getListResponsesByQuestionId(this.questionId).subscribe(existingResponses => {
        const correctResponseExists = existingResponses.some(response => response.responseCorrect);
        const newCorrectResponse = this.responsesArray.controls.some(control => control.value.responseCorrect);
  
        if (correctResponseExists && newCorrectResponse) {
          this.errorMessage = 'Une seule réponse correcte est autorisée.';
          return;
        }
  
        for (const control of this.responsesArray.controls) {
          responsesToAdd.push({
            idResponse: 0,
            response: control.value.response,
            responseCorrect: control.value.responseCorrect,
            questionId: this.questionId
          });
        }
  
        responsesToAdd.forEach(response => {
          this.responseService.addResponse(response, this.questionId).subscribe(() => {
            console.log('Réponse ajoutée avec succès');
          });
        });
  
        if (!this.errorMessage) {
          this.router.navigate(['/responses', this.questionId]);
        }
      });
    } else { // Si le type de question est DRAG_AND_DROP
      for (const control of this.responsesArray.controls) {
        dragAndDropPairsToAdd.push({
          idDragAndDrop: 0,
          sourceText: control.value.sourceText,
          targetText: control.value.targetText,
          questionId: this.questionId
        });
      }
  
      dragAndDropPairsToAdd.forEach(pair => {
        this.responseService.addDragAndDropPair(pair, this.questionId).subscribe(() => {
          console.log('Drag & Drop ajouté avec succès');
        });
      });
  
      if (!this.errorMessage) {
        this.router.navigate(['/responses', this.questionId]);
      }
    }
  }
}