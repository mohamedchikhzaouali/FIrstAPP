import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { QuestionService } from 'src/app/services/QuizServices/question.service';
import { Question } from 'src/app/Model/QuizModel/question';
import Swal from 'sweetalert2';
import { AuthService } from 'src/app/AuthService';
import { Observable, Subscription } from 'rxjs';

@Component({
    selector: 'app-question',
    templateUrl: './question.component.html',
    styleUrls: ['./question.component.scss'],
})
export class QuestionComponent implements OnInit, OnDestroy {
    userRole$: Observable<string | null>;
    quizId: number | null = null;
    courseId: number | null = null; // Add courseId
    questions: any[] = [];
    showResponses: { [key: number]: boolean } = {};
    private routeSubscription: Subscription | undefined;

    constructor(
        private route: ActivatedRoute,
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
            this.quizId = +params.get('quizId')!;
            this.courseId = +params.get('courseId')!; // Get courseId
            console.log('ID du quiz:', this.quizId);
            console.log('ID du cours:', this.courseId);
            this.loadQuestions();
        });
    }

    ngOnDestroy(): void {
        if (this.routeSubscription) {
            this.routeSubscription.unsubscribe(); // Prevent memory leak
        }
    }

    loadQuestions(): void {
        if (this.quizId !== null) {
            this.questionService.getListQuestionsByQuizId(this.quizId).subscribe({
                next: (data) => {
                    console.log("Données reçues :", data);
                    if (Array.isArray(data)) {
                        this.questions = data.map(q => ({
                            ...q,
                            imageUrl: q.questionPictureUrl || null
                        }));
                    } else {
                        console.error("Erreur: l'API ne retourne pas une liste !");
                    }
                },
                error: (error) => {
                    console.error("Erreur lors de la récupération des questions :", error);
                }
            });
        }
    }

    toggleResponses(idQuestion: number): void {
        this.showResponses[idQuestion] = !this.showResponses[idQuestion];
    }

    deleteQuestion(id: number): void {
        console.log("Tentative de suppression de la question ID:", id);
        Swal.fire({
            title: 'Êtes-vous sûr ?',
            text: 'Cette action est irréversible !',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Oui, supprimer',
            cancelButtonText: 'Annuler'
        }).then((result) => {
            if (result.isConfirmed) {
                this.questionService.deleteQuestion(id).subscribe({
                    next: (message) => {
                        Swal.fire('Supprimé !', message, 'success');
                        this.loadQuestions();
                    },
                    error: (err) => {
                        Swal.fire('Erreur !', 'Une erreur est survenue.', 'error');
                        console.error("Erreur lors de la suppression :", err);
                    }
                });
            }
        });
    }

    editQuestion(question: Question): void {
        console.log('Modification de la question:', question);
    }

    goBack(): void {
      this.router.navigate(['/quizzes', this.courseId]); // Navigate back to the quizzes list for the course
    }
}
