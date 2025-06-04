import { Component, OnDestroy, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import Swal from 'sweetalert2';
import { forkJoin, Observable, Subscription, of } from 'rxjs';
import { first, switchMap, catchError, map } from 'rxjs/operators';

import { Attachment } from 'src/app/Model/CourseModel/Attachment';
import { Course } from 'src/app/Model/CourseModel/Course';
import { Review } from 'src/app/Model/CourseModel/Review';
import { Quiz } from 'src/app/Model/QuizModel/quiz';
import { StudentQuiz } from 'src/app/Model/QuizModel/StudentQuiz';

import { AttachmentService } from 'src/app/services/CourseServices/attachement.service';
import { CoursesService } from 'src/app/services/CourseServices/courses.service';
import { ReviewService } from 'src/app/services/CourseServices/review.service';
import { QuizService } from 'src/app/services/QuizServices/quiz.service';
import { StudentQuizService } from 'src/app/services/QuizServices/student-quiz-service.service';
import { AuthService } from 'src/app/AuthService';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-details-course',
  templateUrl: './details-course.component.html',
  styleUrls: ['./details-course.component.scss']
})
export class DetailsCourseComponent implements OnInit, OnDestroy {
  userRole$: Observable<string | null>;
  userId: string | null = null;

  course!: Course;
  attachments: Attachment[] = [];
  reviews: Review[] = [];
  courseScore: number = 0;
  totalTimeSpentOnCourse: number = 0;

  allAttachmentsValidated: boolean = false;
  pdfUrl: SafeResourceUrl | null = null;
  viewedAttachmentId: number | null = null;

  newReview: Review = { rating: 0, comment: '' };
  hoveredStar: number = 0;
  averageRating: number = 0;

  // Propriétés pour les quiz
  certifiedQuiz: Quiz | null = null;
  certifiedQuizPassed: boolean = false;
  availableTrainingQuizzes: Quiz[] = [];
  isLoadingQuizzes: boolean = true;
  private quizUnlockAlertShown: boolean = false;

  // Pour la modale des quiz d'entraînement
  showTrainingQuizModal: boolean = false;

  private attachmentStartTime: number | null = null;
  // ... (autres propriétés privées existantes)
  private timerUpdateInterval: any = null;
  private lastSavedTimeSnapshot: number | null = null;
  private attachmentViewTimes = new Map<number, number>();
  private readonly VALIDATION_TIME_THRESHOLD_MS = 10 * 1000;
  private liveCheckInterval: any = null;
  private thresholdMetIds = new Set<number>();
  private authSubscription: Subscription | undefined;
  private autoValidationTriggered = new Set<number>();
//notification
  showCompletionToast: boolean = false; // NOUVELLE PROPRIÉTÉ
  private toastTimeout: any; // NOUVELLE PROPRIÉTÉ pour stocker l'ID du timeout

// NEW: Properties for quiz unlock toast
  showQuizUnlockToast: boolean = false;
  private quizUnlockToastTimeout: any;
  private quizUnlockAlreadyShownForSession: boolean = false; // To prevent showing it multiple times per session
  

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private sanitizer: DomSanitizer,
    private courseService: CoursesService,
    public attachmentService: AttachmentService,
    private reviewService: ReviewService,
    private cdRef: ChangeDetectorRef,
    public authService: AuthService,
    private quizService: QuizService,
    private studentQuizService: StudentQuizService
  ) {
    this.userRole$ = this.authService.userRole$;
  }

  ngOnInit(): void {
    this.authSubscription = this.authService.userId$.subscribe(id => {
        this.userId = id;
    });

    const courseIdParam = this.route.snapshot.paramMap.get('id');
    if (courseIdParam) {
        const courseId = Number(courseIdParam);
        if (!isNaN(courseId)) {
            this.loadCourseDetails(courseId);
            this.loadUserSpecificAttachments(courseId);
            this.loadCourseReviews(courseId);
            this.loadUserSpecificCourseScore(courseId);
            this.loadUserSpecificTotalTimeSpent(courseId);
            this.loadCourseQuizStates(courseId);
        } else {
            console.error("ID du cours invalide:", courseIdParam);
            Swal.fire('Erreur', "ID du cours invalide.", 'error');
        }
    } else {
        console.error("ID du cours manquant");
        Swal.fire('Erreur', "ID du cours manquant.", 'error');
    }
  }

  ngOnDestroy(): void {
    this.stopTimerAndSaveTime();
    if (this.timerUpdateInterval) { clearInterval(this.timerUpdateInterval); }
    if (this.liveCheckInterval) { clearInterval(this.liveCheckInterval); }
    if (this.authSubscription) { this.authSubscription.unsubscribe(); }
    if (this.toastTimeout) { // NOUVEAU: Nettoyer le timeout lors de la destruction du composant
      clearTimeout(this.toastTimeout);
    }
  }

  // ... (méthodes loadCourseDetails, loadUserSpecificAttachments, etc. restent les mêmes)
  loadCourseDetails(id: number): void {
    this.courseService.getCourseById(id).subscribe({
      next: course => { this.course = course; },
      error: err => console.error("Erreur chargement détails cours:", err)
    });
  }

  loadUserSpecificAttachments(courseId: number): void {
    this.attachmentService.getAttachmentsByCourseForUser(courseId).subscribe({
      next: attachmentsDTO => {
        this.attachments = attachmentsDTO.map(att => ({
            ...att,
            validatedByCurrentUser: att.validatedByCurrentUser ?? false,
            timeSpentByCurrentUser: att.timeSpentByCurrentUser ?? 0
        }));
        this.attachmentViewTimes.clear();
        this.thresholdMetIds.clear();
        this.autoValidationTriggered.clear();
        this.attachments.forEach(att => {
            const initialTime = att.timeSpentByCurrentUser || 0;
            this.attachmentViewTimes.set(att.idAttachment, initialTime);
            if (initialTime >= this.VALIDATION_TIME_THRESHOLD_MS && att.validatedByCurrentUser) {
                this.thresholdMetIds.add(att.idAttachment);
            }
        });
        this.checkAllAttachmentsValidated();
        this.cdRef.detectChanges();
      },
      error: err => console.error("Erreur chargement pièces jointes utilisateur:", err)
    });
  }

  loadCourseReviews(id: number): void {
    this.reviewService.getReviewsByCourse(id).subscribe({
      next: reviews => {
        console.log('AVIS REÇUS DU BACKEND:', reviews);
        this.reviews = reviews;
        this.calculateAverageRating();
        this.cdRef.detectChanges();
      },
      error: err => {
          console.error("Erreur chargement avis:", err);
      }
    });
  }

  loadUserSpecificCourseScore(courseId: number): void {
    this.attachmentService.getCourseScore(courseId).subscribe({
      next: score => {
        this.courseScore = score;
        //this.checkAndShowQuizUnlockAlert();
        this.cdRef.detectChanges();
      },
      error: err => { console.error("Erreur chargement score utilisateur:", err); this.courseScore = 0; }
    });
  }

  loadUserSpecificTotalTimeSpent(courseId: number): void {
    this.attachmentService.getTimeSpentOnCourse(courseId).subscribe({
      next: time => {
        this.totalTimeSpentOnCourse = time;
        this.cdRef.detectChanges();
      },
      error: err => { console.error("Erreur chargement temps total utilisateur:", err); this.totalTimeSpentOnCourse = 0; }
    });
  }

  loadCourseQuizStates(courseId: number): void {
    this.isLoadingQuizzes = true;
    this.quizService.getAllQuizzesByCourseId(courseId).pipe(
      first(),
      switchMap(quizzes => {
        this.certifiedQuiz = quizzes.find(quiz => quiz.type === 'CERTIFIED_QUIZ') || null;
        this.availableTrainingQuizzes = quizzes.filter(quiz => quiz.type === 'TRAINING_QUIZ');

        if (this.certifiedQuiz && this.certifiedQuiz.idQuiz) {
          return this.studentQuizService.getStudentQuizByStudentAndQuiz(this.certifiedQuiz.idQuiz).pipe(
            map(studentQuiz => ({ studentQuiz, isError: false })),
            catchError(error => {
              if (error.status === 404 || error instanceof HttpErrorResponse && error.status === 404) {
                return of({ studentQuiz: null, isError: false });
              }
              console.error('Erreur StudentQuiz certifié:', error);
              return of({ studentQuiz: null, isError: true });
            })
          );
        }
        return of({ studentQuiz: null, isError: false });
      })
    ).subscribe(
      (result: { studentQuiz: StudentQuiz | null, isError: boolean }) => {
        if (!result.isError && result.studentQuiz) {
          this.certifiedQuizPassed = result.studentQuiz.passed;
        } else {
          this.certifiedQuizPassed = false;
        }
        this.isLoadingQuizzes = false;
        //this.checkAndShowQuizUnlockAlert();
        this.checkForQuizUnlockAndShowToast(); // Trigger after quiz states are loaded
        this.cdRef.detectChanges();
      },
      error => {
        console.error('Erreur globale chargement états quiz:', error);
        this.certifiedQuiz = null;
        this.certifiedQuizPassed = false;
        this.availableTrainingQuizzes = [];
        this.isLoadingQuizzes = false;
        //this.checkAndShowQuizUnlockAlert();
        this.checkForQuizUnlockAndShowToast(); // Trigger even on error to ensure flags are set
        this.cdRef.detectChanges();
      }
    );
  }

  /*checkAndShowQuizUnlockAlert(): void {
    if (!this.isLoadingQuizzes && this.courseScore >= 80 && this.certifiedQuiz && !this.certifiedQuizPassed && !this.quizUnlockAlertShown) {
      Swal.fire({
        title: 'Quiz de Certification Débloqué !',
        html: `Félicitations ! Votre progression de <b>${this.courseScore}%</b> vous permet maintenant de tenter le quiz de certification : <br><b>${this.certifiedQuiz.titleQuiz}</b>`,
        icon: 'success',
        confirmButtonText: 'Compris !',
        customClass: {
          title: 'swal-title-custom',
          htmlContainer: 'swal-html-custom',
          confirmButton: 'swal-confirm-button-custom'
        }
      });
      this.quizUnlockAlertShown = true;
    }
  }*/

    // NEW METHOD to check and show quiz unlock toast
  private checkForQuizUnlockAndShowToast(): void {
    // Only show if not loading, score is high enough, certified quiz exists,
    // certified quiz not passed, and not already shown in this session.
    if (
      !this.isLoadingQuizzes &&
      this.courseScore >= 80 &&
      this.certifiedQuiz &&
      !this.certifiedQuizPassed &&
      !this.quizUnlockAlreadyShownForSession
    ) {
      this.showQuizUnlockToast = true;
      this.quizUnlockAlreadyShownForSession = true; // Mark as shown for the current session

      // Clear any previous timeout for this toast
      if (this.quizUnlockToastTimeout) {
        clearTimeout(this.quizUnlockToastTimeout);
      }

      // Hide the toast after 5 seconds (adjust as needed)
      this.quizUnlockToastTimeout = setTimeout(() => {
        this.showQuizUnlockToast = false;
        this.cdRef.detectChanges();
      }, 5000);
    }
  }

  navigateToSpecificQuiz(quizId: number | undefined): void {
    if (quizId) {
      if (this.certifiedQuiz && quizId === this.certifiedQuiz.idQuiz && this.certifiedQuizPassed) {
         Swal.fire('Information', 'Vous avez déjà réussi ce quiz de certification.', 'info');
         this.closeTrainingQuizModal(); // Fermer la modale si elle était ouverte
         return;
      }
      this.closeTrainingQuizModal(); // Fermer la modale avant de naviguer
      this.router.navigate(['/take-quiz-training', quizId]);
    } else {
      Swal.fire('Erreur', 'ID de quiz non valide.', 'error');
      this.closeTrainingQuizModal();
    }
  }

  navigateToSpecificCertifiedQuiz(quizId: number | undefined): void {
    if (quizId) {
      if (this.certifiedQuiz && quizId === this.certifiedQuiz.idQuiz && this.certifiedQuizPassed) {
         Swal.fire('Information', 'Vous avez déjà réussi ce quiz de certification.', 'info');
         this.closeTrainingQuizModal(); // Fermer la modale si elle était ouverte
         return;
      }
      this.closeTrainingQuizModal(); // Fermer la modale avant de naviguer
      this.router.navigate(['/take-quiz', quizId]);
    } else {
      Swal.fire('Erreur', 'ID de quiz non valide.', 'error');
      this.closeTrainingQuizModal();
    }
  }

  // Méthodes pour la modale des quiz d'entraînement
  openTrainingQuizModal(): void {
    if (this.availableTrainingQuizzes.length > 0) {
      this.showTrainingQuizModal = true;
    } else {
      Swal.fire('Information', "Aucun quiz d'entraînement n'est disponible pour ce cours.", 'info');
    }
  }

  closeTrainingQuizModal(): void {
    this.showTrainingQuizModal = false;
  }

  // --- Collez ici vos autres méthodes de composant existantes ---
  // (validateAttachment, invalidateAttachment, etc.)
  validateAttachment(attachmentId: number): void {
    const attachment = this.attachments.find(a => a.idAttachment === attachmentId);
    if (attachment && !attachment.validatedByCurrentUser && this.isValidationDisabled(attachment)) {
        Swal.fire('Info', 'Vous devez consulter le fichier pendant au moins 2 minutes pour le valider.', 'info');
        return;
    }
    if (attachment && attachment.validatedByCurrentUser) {
        console.log(`Attachment ${attachmentId} est déjà marqué comme validé localement.`);
        return;
    }
    this.attachmentService.validateAttachment(attachmentId).subscribe({
      next: (response) => {
        const index = this.attachments.findIndex(a => a.idAttachment === attachmentId);
        if (index > -1) {
            const updatedAttachments = [...this.attachments];
            updatedAttachments[index] = { ...updatedAttachments[index], validatedByCurrentUser: true };
            this.attachments = updatedAttachments;
            this.thresholdMetIds.add(attachmentId);
            this.autoValidationTriggered.delete(attachmentId);
        }
        if (this.course) this.loadUserSpecificCourseScore(this.course.idCourse);
        this.checkAllAttachmentsValidated();
        this.cdRef.detectChanges();
      },
      error: (err) => {
        console.error("Erreur validation attachment utilisateur:", err);
        Swal.fire('Erreur', 'La validation a échoué.', 'error');
        this.autoValidationTriggered.delete(attachmentId);
      }
    });
  }

  invalidateAttachment(attachmentId: number): void {
    this.attachmentService.invalidateAttachment(attachmentId).subscribe({
      next: (response) => {
        const index = this.attachments.findIndex(a => a.idAttachment === attachmentId);
        if (index > -1) {
            const updatedAttachments = [...this.attachments];
            updatedAttachments[index] = { ...updatedAttachments[index], validatedByCurrentUser: false };
            this.attachments = updatedAttachments;
        }
        if (this.course) this.loadUserSpecificCourseScore(this.course.idCourse);
        this.checkAllAttachmentsValidated();
        this.cdRef.detectChanges();
      },
      error: (err) => {
        console.error("Erreur invalidation attachment utilisateur:", err);
        Swal.fire('Erreur', "L'invalidation a échoué.", 'error');
      }
    });
  }
checkAllAttachmentsValidated(): void {
    const previousValidationState = this.allAttachmentsValidated; // Stocker l'état précédent
    this.allAttachmentsValidated = this.attachments && this.attachments.length > 0 && this.attachments.every(a => a.validatedByCurrentUser);

    // Si tous les attachements viennent d'être validés (l'état a changé à true)
    if (this.allAttachmentsValidated && !previousValidationState) {
      this.showCompletionToast = true; // Afficher le toast

      // Annuler un timeout précédent s'il existe (au cas où la méthode serait appelée rapidement plusieurs fois)
      if (this.toastTimeout) {
        clearTimeout(this.toastTimeout);
      }

      // Faire disparaître le toast après quelques secondes (par exemple 5 secondes)
      this.toastTimeout = setTimeout(() => {
        this.showCompletionToast = false;
        this.cdRef.detectChanges(); // Important pour mettre à jour la vue si le timeout est hors de la zone Angular
      }, 5000); // 5000 millisecondes = 5 secondes
    }
  }

  isValidationDisabled(attachment: Attachment): boolean {
    if (attachment.validatedByCurrentUser) { return false; }
    const storedTime = this.attachmentViewTimes.get(attachment.idAttachment) || 0;
    let currentSessionTime = 0;
    if (this.viewedAttachmentId === attachment.idAttachment && this.attachmentStartTime) {
      currentSessionTime = (Date.now() - this.attachmentStartTime);
    }
    const totalCumulativeCheck = storedTime + currentSessionTime;
    return totalCumulativeCheck < this.VALIDATION_TIME_THRESHOLD_MS;
  }

  viewPDF(attachment: Attachment): void {
    this.stopTimerAndSaveTime();
    if (this.liveCheckInterval) { clearInterval(this.liveCheckInterval); this.liveCheckInterval = null;}
    const filename = attachment.source?.split('\\').pop()?.split('/').pop();
    const unsafeUrl = `http://localhost:8087/attachments/attachments/${filename}`;
    if (filename) {
      this.pdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(unsafeUrl);
      this.viewedAttachmentId = attachment.idAttachment;
      this.attachmentStartTime = Date.now();
      this.lastSavedTimeSnapshot = this.attachmentStartTime;
      this.startPeriodicSave();
      this.startLiveCheck();
    } else {
        console.error("Nom de fichier invalide:", attachment);
        Swal.fire('Erreur', 'Impossible de charger le fichier PDF.', 'error');
    }
  }

  closePDF(): void {
    this.stopTimerAndSaveTime();
    this.pdfUrl = null;
    if (this.liveCheckInterval) { clearInterval(this.liveCheckInterval); this.liveCheckInterval = null;}
    this.cdRef.detectChanges();
  }

  private stopTimerAndSaveTime(): void {
    if (this.viewedAttachmentId !== null && this.lastSavedTimeSnapshot !== null && this.attachmentStartTime !== null) {
        const endTime = Date.now();
        const currentId = this.viewedAttachmentId;
        const timeIncrementSinceLastSave = endTime - this.lastSavedTimeSnapshot;
        const totalSessionTime = endTime - this.attachmentStartTime;
        const previouslyStoredTotalTime = this.attachmentViewTimes.get(currentId) || 0;

        if (timeIncrementSinceLastSave > 100 && this.userId) {
            this.attachmentService.updateTimeSpent(currentId, timeIncrementSinceLastSave).subscribe({
                next: (response) => {
                    const newTotalCumulativeTimeForAttachment = previouslyStoredTotalTime + timeIncrementSinceLastSave;
                    this.attachmentViewTimes.set(currentId, newTotalCumulativeTimeForAttachment);
                    const attachmentToUpdate = this.attachments.find(att => att.idAttachment === currentId);
                    if (attachmentToUpdate) {
                        attachmentToUpdate.timeSpentByCurrentUser = newTotalCumulativeTimeForAttachment;
                    }
                    if(this.course) this.loadUserSpecificTotalTimeSpent(this.course.idCourse);
                    if (currentId !== null && !this.autoValidationTriggered.has(currentId) && !attachmentToUpdate?.validatedByCurrentUser && newTotalCumulativeTimeForAttachment >= this.VALIDATION_TIME_THRESHOLD_MS) {
                        this.validateAttachment(currentId);
                        this.autoValidationTriggered.add(currentId);
                    }
                    this.cdRef.detectChanges();
                },
                error: (err) => console.error("stopTimerAndSaveTime - ERREUR:", err)
            });
        } else {
          if (this.userId && currentId !== null && !this.autoValidationTriggered.has(currentId) && !this.attachments.find(a => a.idAttachment === currentId)?.validatedByCurrentUser && (previouslyStoredTotalTime + totalSessionTime) >= this.VALIDATION_TIME_THRESHOLD_MS) {
            this.validateAttachment(currentId);
            this.autoValidationTriggered.add(currentId);
          }
        }
    }
    this.attachmentStartTime = null;
    this.viewedAttachmentId = null;
    this.lastSavedTimeSnapshot = null;
    if (this.timerUpdateInterval) {
        clearInterval(this.timerUpdateInterval);
        this.timerUpdateInterval = null;
    }
  }

  private startPeriodicSave(): void {
    if (this.timerUpdateInterval) { clearInterval(this.timerUpdateInterval); }
    const intervalMs = 30000;
    this.timerUpdateInterval = setInterval(() => {
        if (this.viewedAttachmentId !== null && this.lastSavedTimeSnapshot !== null && this.userId && this.attachmentStartTime !== null) {
            const currentTime = Date.now();
            const timeIncrementMs = currentTime - this.lastSavedTimeSnapshot;
            const currentAttId = this.viewedAttachmentId;
            if (timeIncrementMs > 100) {
                this.attachmentService.updateTimeSpent(currentAttId, timeIncrementMs).subscribe({
                    next: (response) => {
                        this.lastSavedTimeSnapshot = currentTime;
                        const prevTime = this.attachmentViewTimes.get(currentAttId) || 0;
                        const newCumulativeTime = prevTime + timeIncrementMs;
                        this.attachmentViewTimes.set(currentAttId, newCumulativeTime);
                        const attachmentInArray = this.attachments.find(att => att.idAttachment === currentAttId);
                        if (attachmentInArray) {
                            attachmentInArray.timeSpentByCurrentUser = newCumulativeTime;
                        }
                        if(this.course) this.loadUserSpecificTotalTimeSpent(this.course.idCourse);
                        this.cdRef.detectChanges();
                    },
                    error: (err) => console.error("startPeriodicSave - ERREUR:", err)
                });
            }
        } else {
            if(this.timerUpdateInterval) {
                clearInterval(this.timerUpdateInterval);
                this.timerUpdateInterval = null;
            }
        }
    }, intervalMs);
  }

  private startLiveCheck(): void {
    if (this.liveCheckInterval) { clearInterval(this.liveCheckInterval); }
    const checkIntervalMs = 1000;
    this.liveCheckInterval = setInterval(() => {
      if (!this.viewedAttachmentId && this.liveCheckInterval) {
        clearInterval(this.liveCheckInterval);
        this.liveCheckInterval = null;
        return;
      }
      if (this.viewedAttachmentId) {
        const currentAttachment = this.attachments.find(att => att.idAttachment === this.viewedAttachmentId);
        if (currentAttachment && !currentAttachment.validatedByCurrentUser && !this.autoValidationTriggered.has(currentAttachment.idAttachment)) {
          const storedTime = this.attachmentViewTimes.get(currentAttachment.idAttachment) || 0;
          let currentSessionTime = 0;
          if (this.attachmentStartTime) {
            currentSessionTime = (Date.now() - this.attachmentStartTime);
          }
          const totalCumulativeCheck = storedTime + currentSessionTime;
          if (totalCumulativeCheck >= this.VALIDATION_TIME_THRESHOLD_MS) {
            this.autoValidationTriggered.add(currentAttachment.idAttachment);
            this.validateAttachment(currentAttachment.idAttachment);
          }
        }
      }
      this.cdRef.detectChanges();
    }, checkIntervalMs);
  }

  calculateAverageRating(): void {
    if (this.reviews && this.reviews.length > 0) {
      const totalRating = this.reviews.reduce((sum, review) => sum + review.rating, 0);
      this.averageRating = isNaN(totalRating) ? 0 : totalRating / this.reviews.length;
    } else {
      this.averageRating = 0;
    }
  }

  submitReview(): void {
  if (!this.newReview.comment.trim() || this.newReview.rating === 0) {
    Swal.fire('Erreur', 'Veuillez fournir une note et un commentaire.', 'error');
    return;
  }
  if (!this.course || this.course.idCourse === undefined) {
    Swal.fire('Erreur', "Impossible d'identifier le cours.", 'error');
    return;
  }
  const courseId = this.course.idCourse;
  this.reviewService.addReview(courseId, this.newReview.rating, this.newReview.comment) // Utilisation de addReview du service
    .subscribe({
      next: (savedReview) => {
        Swal.fire('Succès', 'Votre avis a été ajouté !', 'success');
        this.loadCourseReviews(courseId);
        this.newReview = { rating: 0, comment: '' };
        this.hoveredStar = 0;
        this.cdRef.detectChanges();
      },
      error: (errorResponse: HttpErrorResponse) => {
        let displayMessage = "Une erreur est survenue lors de l'ajout de votre avis.";
        if (errorResponse.status === 400 && typeof errorResponse.error === 'string' && errorResponse.error.includes('inapproprié')) {
          displayMessage = errorResponse.error;
        } else if (errorResponse.error && typeof errorResponse.error === 'string') {
            displayMessage = errorResponse.error;
        } else if (errorResponse.status === 401 || errorResponse.status === 403) {
            displayMessage = "Vous devez être connecté en tant qu'étudiant pour laisser un avis.";
        }
        Swal.fire('Erreur', displayMessage, 'error');
      }
    });
}
  deleteReview(reviewId?: number): void {
    if (!reviewId) {
      Swal.fire('Information', "ID de l'avis inconnu.", 'info');
      return;
    }
    Swal.fire({
      title: 'Êtes-vous sûr ?', text: "Cette action est irréversible !", icon: 'warning',
      showCancelButton: true, confirmButtonColor: '#d33', cancelButtonColor: '#3085d6',
      confirmButtonText: 'Oui, supprimer !', cancelButtonText: 'Annuler'
    }).then((result) => {
      if (result.isConfirmed) {
        this.reviewService.deleteReview(reviewId).subscribe({
          next: () => {
            this.reviews = this.reviews.filter(review => review.idReview !== reviewId);
            this.calculateAverageRating();
            this.cdRef.detectChanges();
            Swal.fire('Supprimé !', "L'avis a été supprimé.", 'success');
          },
          error: (err) => {
            Swal.fire('Erreur !', "La suppression a échoué.", 'error');
          }
        });
      }
    });
  }

  hoverStar(star: number): void { this.hoveredStar = star; }
  setRating(rating: number): void { this.newReview.rating = rating; this.hoveredStar = rating; }

}