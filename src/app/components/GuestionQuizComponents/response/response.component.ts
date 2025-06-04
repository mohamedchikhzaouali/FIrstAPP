import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ResponseService } from 'src/app/services/QuizServices/response.service';
import { QuestionService } from 'src/app/services/QuizServices/question.service';
import { Response } from 'src/app/Model/QuizModel/response';
import { DragAndDropPair } from 'src/app/Model/QuizModel/dragAndDropPair';
import Swal from 'sweetalert2';
import { AuthService } from 'src/app/AuthService';
import { Observable, Subscription } from 'rxjs'; // Importez Observable et Subscription

@Component({
  selector: 'app-responses',
  templateUrl: './response.component.html',
  styleUrls: ['./response.component.scss']
})
export class ResponseComponent implements OnInit, OnDestroy { // Implement OnDestroy
  userRole$: Observable<string | null>;

  courseId: number | null = null;
  quizId: number | null = null; // NEW: Store quizId
  questionId!: number;
  responses: Response[] = [];
  dragAndDropPairs: DragAndDropPair[] = [];
  questionType: string = '';
  private routeSubscription: Subscription | undefined;
  
    constructor(
      private route: ActivatedRoute,
      private responseService: ResponseService,
      private questionService: QuestionService,
      private router: Router,
      private authService: AuthService
    ) {
      this.userRole$ = this.authService.userRole$;
    }
  
    ngOnInit(): void {
    this.userRole$.subscribe(role => {
      console.log('Rôle actuel (AppComponent):', role);
    });

    this.routeSubscription = this.route.paramMap.subscribe(params => {
      this.quizId = +params.get('quizId')!; // Get quizId from route
      this.questionId = +params.get('questionId')!; // Get questionId from route
      this.courseId = +params.get('courseId')!; // Get courseId from route

      console.log('ID du quiz:', this.quizId);
      console.log('ID de la question:', this.questionId);
      console.log('ID du cours:', this.courseId);

      if (this.questionId !== null) {
        this.getQuestionTypeAndResponses();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe(); // Unsubscribe to prevent memory leaks
    }
  }
      
      getQuestionTypeAndResponses(): void {
        this.questionService.getQuestionById(this.questionId!).subscribe({
          next: (question) => {
            this.questionType = question.type;
            console.log("Type de la question :", this.questionType);
            this.getResponsesForQuestion(); // Appeler après avoir obtenu le type
          },
          error: (error) => {
            console.error("Erreur lors de la récupération du type de question :", error);
          }
        });
      }      
  
    getResponsesForQuestion(): void {
        if (this.questionType === 'DRAG_AND_DROP') {
          this.responseService.getListDragAndDropByQuestionId(this.questionId!).subscribe({
            next: (data) => {
              console.log("Paires Drag & Drop reçues :", data);
              this.dragAndDropPairs = data;
            },
            error: (error) => {
              console.error("Erreur lors de la récupération des paires Drag & Drop :", error);
            }
          });
        } else {
          this.responseService.getListResponsesByQuestionId(this.questionId!).subscribe({
            next: (data) => {
              console.log("Données reçues :", data);
              this.responses = data;
            },
            error: (error) => {
              console.error("Erreur lors de la récupération des réponses :", error);
            }
          });
        }
      }
      
  
      deleteResponse(id: number): void {
        Swal.fire({
          title: 'Êtes-vous sûr ?',
          text: 'Cette action est irréversible !',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Oui, supprimer',
          cancelButtonText: 'Annuler'
        }).then((result) => {
          if (result.isConfirmed) {
            let deleteObservable;
      
            if (this.questionType === 'DRAG_AND_DROP') {
                if (!id) {
                    console.error("ID invalide pour la suppression !");
                    return;
                  }
                  deleteObservable = this.responseService.deleteDragAndDropPair(id);
                              } else {
              deleteObservable = this.responseService.deleteResponse(id);
            }
      
            deleteObservable.subscribe({
              next: () => {
                Swal.fire('Supprimé !', 'Réponse supprimée avec succès.', 'success');
                this.getResponsesForQuestion();
              },
              error: (err) => {
                Swal.fire('Erreur !', 'Une erreur est survenue.', 'error');
                console.error("Erreur lors de la suppression :", err);
              }
            });
          }
        });
      }
      
      goBack(): void {
        this.router.navigate(['/questions', this.quizId, 'course', this.courseId]);
      }
  }  