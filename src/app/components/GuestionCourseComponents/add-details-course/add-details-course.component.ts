// Dans src/app/components/Teacher/add-details-course/add-details-course.component.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Attachment } from 'src/app/Model/CourseModel/Attachment';
import { Course } from 'src/app/Model/CourseModel/Course';
import { Review, AuthorInfo } from 'src/app/Model/CourseModel/Review'; // MODIFIÉ: Importer AuthorInfo
import { AttachmentService } from 'src/app/services/CourseServices/attachement.service';
import { CoursesService } from 'src/app/services/CourseServices/courses.service';
import { ReviewService } from 'src/app/services/CourseServices/review.service';
import { AuthService } from 'src/app/AuthService';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-add-details-course',
  templateUrl: './add-details-course.component.html',
  styleUrls: ['./add-details-course.component.scss'] // Assurez-vous que ce fichier existe et est correct
})
export class AddDetailsCourseComponent implements OnInit {
  userRole$: Observable<string | null>;

  idCourse!: number;
  attachments: Attachment[] = [];
  chapterTitle = '';
  selectedFile!: File | null;
  
  reviews: Review[] = []; // Gardera les objets Review complets, incluant l'auteur
  averageRating: number = 0; // Peut être utile pour l'enseignant aussi
  // newReview n'est pas nécessaire ici car les enseignants ne postent pas d'avis sur leurs propres cours

  course!: Course;
  isEditing: boolean = false;
  editingAttachment: Attachment | null = null;
  selectedEditFile: File | null = null;
  isEditingCourse: boolean = false; // Si vous avez une logique d'édition de cours ici
  editingCourse: Course | null = null; // Si vous avez une logique d'édition de cours ici
  selectedEditImage: File | null = null; // Si vous avez une logique d'édition de cours ici
  
  constructor(
    private route: ActivatedRoute,
    private attachmentService: AttachmentService,
    private courseService: CoursesService,
    private reviewService: ReviewService,
    public authService: AuthService
  ) {
    this.userRole$ = this.authService.userRole$;
  }

  ngOnInit(): void {
    this.userRole$.subscribe(role => {
      console.log('Rôle actuel (AddDetailsCourseComponent):', role);
    });

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
        this.idCourse = +idParam;
        if (!isNaN(this.idCourse)) {
            this.loadCourseDetails();
            this.loadAttachments(this.idCourse);
            this.loadReviewsAndAverageRating(); // Renommé pour clarté
        } else {
            console.error("ID du cours invalide:", idParam);
        }
    } else {
        console.error("Aucun ID de cours trouvé dans les paramètres de la route.");
    }
  }

  loadCourseDetails(): void {
    if (isNaN(this.idCourse)) {
        console.error("ID du cours non valide pour loadCourseDetails:", this.idCourse);
        return;
    }
    this.courseService.getCourseById(this.idCourse).subscribe({
      next: (data) => {
        this.course = data;
      },
      error: (err) => {
        console.error("Erreur lors du chargement du cours :", err);
      }
    });
  }

  loadAttachments(courseId: number): void {
    if (isNaN(courseId)) {
        console.error("Tentative de chargement des attachments avec un courseId invalide:", courseId);
        return;
    }
    // Pour l'enseignant, l'endpoint général des attachments est correct.
    this.attachmentService.getAttachmentsByCourse(courseId).subscribe({
      next: (data) => {
        this.attachments = data;
      },
      error: (err) => {
        console.error("Erreur lors du chargement des attachments :", err);
      }
    });
  }
  
  onFileSelected(event: any): void {
    if (event.target.files.length > 0) {
      this.selectedFile = event.target.files[0];
    } else {
      this.selectedFile = null;
    }
  }

  addAttachment(): void {
    if (!this.selectedFile) {
      alert('Veuillez sélectionner un fichier.');
      return;
    }
    if (!this.chapterTitle.trim()) {
      alert('Veuillez entrer un titre pour le chapitre/ressource.');
      return;
    }
    if (isNaN(this.idCourse)) {
        alert("ID du cours non valide. Impossible d'ajouter la pièce jointe.");
        return;
    }

    this.attachmentService.addAttachment(this.idCourse, this.selectedFile, this.chapterTitle)
      .subscribe({
        next: (response) => {
          alert('Pièce jointe ajoutée avec succès !');
          this.loadAttachments(this.idCourse); 
          this.chapterTitle = ''; 
          this.selectedFile = null; 
          const fileInput = document.getElementById('attachmentFile') as HTMLInputElement; // Si votre input a cet ID
          if (fileInput) fileInput.value = '';
        },
        error: (err) => {
          console.error("Erreur lors de l'ajout :", err);
          alert("Erreur lors de l'ajout de la pièce jointe: " + (err.error?.message || err.message || 'Erreur inconnue'));
        }
      });
  }

  deleteAttachment(attachmentId?: number): void {
    if (typeof attachmentId === 'undefined') {
        console.error("ID de l'attachment non défini pour la suppression.");
        alert("Impossible de supprimer : ID de la pièce jointe manquant.");
        return;
    }
    if (confirm('Voulez-vous vraiment supprimer cet attachment ?')) {
      this.attachmentService.deleteAttachment(attachmentId).subscribe({
        next: () => {
          alert('Attachment supprimé avec succès !');
          this.loadAttachments(this.idCourse); 
        },
        error: (err) => {
          console.error("Erreur lors de la suppression :", err);
          alert("Erreur lors de la suppression de la pièce jointe.");
        }
      });
    }
  }

  toggleVisibility(attachment: Attachment): void {
    if (!attachment || typeof attachment.idAttachment === 'undefined') {
        console.error("Tentative de modifier la visibilité d'un attachment invalide:", attachment);
        return;
    }
    this.attachmentService.updateVisibility(attachment.idAttachment, !attachment.visible)
      .subscribe({
        next: () => {
          attachment.visible = !attachment.visible;
        },
        error: (err) => {
          console.error("Erreur lors de la mise à jour de la visibilité :", err);
          alert("Erreur lors de la mise à jour de la visibilité.");
        }
      });
  }

  openEditForm(attachment: Attachment): void {
    this.isEditing = true;
    this.editingAttachment = { ...attachment }; 
    this.selectedEditFile = null; 
  }

  onEditFileSelected(event: any): void {
    if (event.target.files.length > 0) {
      this.selectedEditFile = event.target.files[0];
    } else {
      this.selectedEditFile = null;
    }
  }

  updateAttachment(): void {
    if (!this.editingAttachment || typeof this.editingAttachment.idAttachment === 'undefined') {
        alert("Aucune pièce jointe n'est sélectionnée pour la modification.");
        return;
    }
    if (!this.editingAttachment.chapterTitle.trim()) {
        alert("Le titre du chapitre ne peut pas être vide.");
        return;
    }

    this.attachmentService.updateAttachment(
      this.editingAttachment.idAttachment,
      this.selectedEditFile,
      this.editingAttachment.chapterTitle,
      this.editingAttachment.visible 
    ).subscribe({
      next: () => {
        alert('Attachment mis à jour avec succès !');
        this.isEditing = false; 
        this.editingAttachment = null;
        this.selectedEditFile = null;
        this.loadAttachments(this.idCourse); 
      },
      error: (err) => {
        console.error("Erreur lors de la mise à jour :", err);
        alert("Erreur lors de la mise à jour de la pièce jointe.");
      }
    });
  }

  cancelEdit(): void {
    this.isEditing = false;
    this.editingAttachment = null;
    this.selectedEditFile = null;
  }

  loadReviewsAndAverageRating(): void { // Renommé pour refléter les deux actions
    if (isNaN(this.idCourse)) {
        console.error("ID du cours non valide pour loadReviews:", this.idCourse);
        return;
    }
    this.reviewService.getReviewsByCourse(this.idCourse).subscribe({
      next: (data) => {
        console.log('Avis reçus pour le cours (enseignant):', JSON.stringify(data, null, 2)); // Log pour débogage
        this.reviews = data;
        this.calculateAverageRating(); // Calculer la note moyenne après avoir chargé les avis
      },
      error: (err) => {
        console.error("Erreur lors du chargement des reviews :", err);
        this.reviews = []; // Assurer que reviews est un tableau vide en cas d'erreur
        this.averageRating = 0;
      }
    });
  }

  calculateAverageRating(): void {
    if (this.reviews && this.reviews.length > 0) {
      const totalRating = this.reviews.reduce((sum, review) => sum + review.rating, 0);
      this.averageRating = totalRating / this.reviews.length;
    } else {
      this.averageRating = 0;
    }
  }

  // L'enseignant ne soumet pas d'avis, donc la méthode submitReview n'est pas nécessaire ici.
  // S'il peut supprimer des avis (en tant qu'admin ou modérateur de son cours) :
  deleteReviewForTeacher(reviewId?: number): void {
    if (typeof reviewId === 'undefined') {
      alert("ID de l'avis manquant.");
      return;
    }
    if (confirm('Voulez-vous vraiment supprimer cet avis ?')) {
      this.reviewService.deleteReview(reviewId).subscribe({
        next: () => {
          alert('Avis supprimé avec succès !');
          this.loadReviewsAndAverageRating(); // Recharger les avis et recalculer la moyenne
        },
        error: (err) => {
          console.error("Erreur lors de la suppression de l'avis :", err);
          alert("Erreur lors de la suppression de l'avis.");
        }
      });
    }
  }
}