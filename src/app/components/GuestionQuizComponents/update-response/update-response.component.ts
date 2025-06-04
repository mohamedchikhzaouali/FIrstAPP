import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ResponseService } from 'src/app/services/QuizServices/response.service';
import { QuestionService } from 'src/app/services/QuizServices/question.service';
import { Response } from 'src/app/Model/QuizModel/response';
import { DragAndDropPair } from 'src/app/Model/QuizModel/dragAndDropPair';
import { Question } from 'src/app/Model/QuizModel/question';
import { switchMap, tap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { Location } from '@angular/common';

@Component({
  selector: 'app-update-response',
  templateUrl: './update-response.component.html',
  styleUrls: ['./update-response.component.scss']
})
export class UpdateResponseComponent implements OnInit {
  updateResponseForm: FormGroup;
  updateDragAndDropForm: FormGroup;
  responses: Response[] = [];
  responseId: number | null = null;
  questionId: number | null = null;
  questionType: string = '';
  loading: boolean = true; // Ajout d'un indicateur de chargement
  errorMessage: string = '';


  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private responseService: ResponseService,
    private questionService: QuestionService,
    private location: Location // Injecter le service Location
  ) {
    this.updateResponseForm = this.fb.group({
      response: ['', Validators.required],
      responseCorrect: [false]
    });

    this.updateDragAndDropForm = this.fb.group({
      sourceText: ['', Validators.required],
      targetText: ['', Validators.required]
    });
  }
  
  ngOnInit(): void {
    this.route.paramMap.pipe(
      tap(params => {
        this.responseId = +params.get('id')!;
        this.questionId = +params.get('questionId')!;

        if (this.questionId === null) {
          console.error('ID de question invalide');
          this.router.navigate(['/error']);
          return;
        }
      }),
      switchMap(params => this.questionService.getQuestionById(this.questionId!)),
      tap(question => this.questionType = question.type),
      switchMap(() => {
        if (this.responseId !== null && this.questionType === 'DRAG_AND_DROP') {
          return this.responseService.getDragAndDropPairById(this.responseId);
        } else if (this.responseId !== null && this.questionType === 'MULTIPLE_CHOICE') {
          return this.responseService.getResponseById(this.responseId);
        } else {
          console.error('ID de réponse ou de Drag and Drop invalide');
          this.router.navigate(['/error']);
          return of(null); // Return an observable of null to avoid errors
        }
      }),
      catchError(err => {
        console.error('Erreur lors du chargement des données', err);
        alert('Erreur lors du chargement des données');
        this.router.navigate(['/error']);
        return of(null);
      }),
      tap(data => {
        if (data) {
          if (this.questionType === 'DRAG_AND_DROP') {
            this.updateDragAndDropForm.patchValue({
              sourceText: (data as DragAndDropPair).sourceText,
              targetText: (data as DragAndDropPair).targetText
            });
          } else if (this.questionType === 'MULTIPLE_CHOICE') {
            this.updateResponseForm.patchValue({
              response: (data as Response).response,
              responseCorrect: (data as Response).responseCorrect
            });
          }
        }
        this.loading = false; // Indique que le chargement est terminé
      })
    ).subscribe();
  }

  async validateCorrectResponses(): Promise<boolean> {
    if (this.questionType === 'MULTIPLE_CHOICE') {
      const correctResponses = this.updateResponseForm.get('responseCorrect')?.value;
      if (correctResponses) {
        return new Promise<boolean>((resolve) => {
          this.responseService.getListResponsesByQuestionId(this.questionId!).subscribe(existingResponses => {
            const correctResponseExists = existingResponses.some(response => response.responseCorrect && response.idResponse !== this.responseId);
            if (correctResponseExists) {
              this.errorMessage = 'Une seule réponse correcte est autorisée.';
              resolve(false);
            } else {
              this.errorMessage = '';
              resolve(true);
            }
          });
        });
      } else {
        this.errorMessage = '';
        return true;
      }
    }
    return true;
  }

  async updateResponse(): Promise<void> {
    const isValid = await this.validateCorrectResponses();
    if (!isValid) {
      return;
    }

    if (this.updateResponseForm.valid && this.responseId !== null && this.questionId !== null) {
      const formValue = this.updateResponseForm.value;
      const updatedResponse: Response = {
        idResponse: this.responseId!,
        response: formValue.response,
        responseCorrect: formValue.responseCorrect,
        questionId: this.questionId!
      };

      this.responseService.updateResponse(this.responseId!, updatedResponse).subscribe({
        next: () => {
          console.log('Réponse mise à jour avec succès');
          this.router.navigate(['/responses', this.questionId]);
        },
        error: err => {
          console.error('Erreur lors de la mise à jour de la réponse', err);
          alert('Erreur lors de la mise à jour');
        }
      });
    } else {
      console.error('Formulaire invalide ou ID manquant');
    }
  }

  updateDragAndDrop(): void {
    if (this.updateDragAndDropForm.valid && this.responseId !== null && this.questionId !== null) {
      const formValue = this.updateDragAndDropForm.value;
      const updatedDragAndDrop: DragAndDropPair = {
        idDragAndDrop: this.responseId!,
        sourceText: formValue.sourceText,
        targetText: formValue.targetText,
        questionId: this.questionId!
      };

      this.responseService.updateDragAndDropPair(this.responseId!, updatedDragAndDrop).subscribe({
        next: () => {
          console.log('Paire Drag and Drop mise à jour avec succès');
          this.router.navigate(['/responses', this.questionId]);
        },
        error: err => {
          console.error('Erreur lors de la mise à jour de la paire Drag and Drop', err);
          alert('Erreur lors de la mise à jour');
        }
      });
    } else {
      console.error('Formulaire invalide ou ID manquant');
    }
  }

  goBack(): void {
    this.location.back(); // Utiliser location.back()
  }
}