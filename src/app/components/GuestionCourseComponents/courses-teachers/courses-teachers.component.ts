import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import * as bootstrap from 'bootstrap';
import { Course } from 'src/app/Model/CourseModel/Course';
import { CourseCategory } from 'src/app/Model/CourseModel/Coursecategory';
import { CoursesService } from 'src/app/services/CourseServices/courses.service';
import { DatePipe } from '@angular/common';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/AuthService';
import { Observable } from 'rxjs';

@Component({
    selector: 'app-courses-teachers',
    templateUrl: './courses-teachers.component.html',
    styleUrls: ['./courses-teachers.component.scss'],
    providers: [DatePipe]
})
export class CoursesTeachersComponent implements OnInit {
    userRole$: Observable<string | null>;

    courses: any[] = [];
    selectedCourse: any = {}; // Pour édition
    filteredCourses: any[] = [];
    searchQuery: string = '';
    isSpeaking: boolean = false;

    selectedFile: File | null = null; // Pour ajout/édition
    categories = Object.values(CourseCategory) as string[];
    levels = ['Beginner', 'Intermediate', 'Advanced'];
    isEditModalOpen = false; // Contrôle l'état du modal d'édition

    newCourseData = {
        title: '', description: '', level: '', category: '',
        price: null as number | null, status: false, liked: false, date: null as string | null, file: null as File | null
    };

    scheduledCourseData = {
        title: '', description: '', level: '', category: '',
        price: null as number | null, status: false, liked: false,
        scheduledPublishDate: '', file: null as File | null
    };

    courseToDelete: any;

    currentPage: number = 1;
    itemsPerPage: number = 6;

    constructor(
        private courseService: CoursesService,
        private cdr: ChangeDetectorRef,
        private http: HttpClient, // Peut-être pas nécessaire directement ici si tout passe par le service
        private datePipe: DatePipe,
        private router: Router,
        private authService: AuthService
    ) {
      this.userRole$ = this.authService.userRole$;
    }

    ngOnInit(): void {
        this.userRole$.subscribe(role => {
            // Note : 'AppComponent' était dans votre log original, j'ai mis 'CoursesTeachersComponent' pour correspondre au composant actuel.
            console.log('Rôle actuel (CoursesTeachersComponent):', role);
        });
        this.loadCourses();
    }

    loadCourses() {
        // APPEL MODIFIÉ ICI pour récupérer les cours de l'enseignant connecté
        this.courseService.getCoursesForCurrentTeacher().subscribe({
            next: (data) => {
                this.courses = data.map(course => ({
                    ...course,
                    date: course.date ? new Date(course.date).toISOString().split('T')[0] : null,
                    title: course.title || 'Titre non disponible',
                    category: course.category || 'Catégorie non définie',
                    price: course.price ?? 0,
                    status: course.status ?? false,
                    liked: course.liked ?? false,
                    formattedMonth: course.date && this.datePipe ? this.datePipe.transform(course.date, 'MMM', 'UTC', 'fr-FR')?.toUpperCase() : '',
                    formattedDay: course.date && this.datePipe ? this.datePipe.transform(course.date, 'd', 'UTC', 'fr-FR') : ''
                }));
                this.filteredCourses = [...this.courses];
                this.currentPage = 1;
                this.cdr.detectChanges();
                console.log("Courses for current teacher loaded: ", this.courses);
            },
            error: (error) => {
                console.error('Erreur lors du chargement des cours pour l\'enseignant:', error);
                Swal.fire('Erreur', 'Impossible de charger vos cours. Veuillez réessayer.', 'error');
                this.courses = [];
                this.filteredCourses = [];
            }
        });
    }

    getTodayDate(): string {
        return new Date().toISOString().split('T')[0];
    }

    getCurrentDateTimeLocal(): string {
      const now = new Date();
      const offset = now.getTimezoneOffset() * 60000;
      const localISOTime = new Date(now.getTime() - offset).toISOString().slice(0, 16);
      return localISOTime;
    }

    openModal(modalId: string): void {
        const modalElement = document.getElementById(modalId);
        if (modalElement) {
            const modal = new bootstrap.Modal(modalElement);
            modal.show();
        }
    }

    closeModal(modalId: string): void {
        const modalElement = document.getElementById(modalId);
        if (modalElement) {
            const modalInstance = bootstrap.Modal.getInstance(modalElement);
            modalInstance?.hide();
            if (modalId === 'editCourseModal') {
                this.isEditModalOpen = false;
                this.selectedCourse = {};
                this.selectedFile = null;
            }
            if (modalId === 'addCourseModal') {
                this.newCourseData = { title: '', description: '', level: '', category: '', price: null, status: false, liked: false, date: null, file: null };
                this.selectedFile = null;
            }
            if (modalId === 'addCourseWithDateModal') {
              this.scheduledCourseData = { title: '', description: '', level: '', category: '', price: null, status: false, liked: false, scheduledPublishDate: '', file: null };
              this.selectedFile = null;
            }
        }
    }

    handleAddCourseSubmit(form: NgForm): void {
        if (form.invalid) {
            Object.values(form.controls).forEach(control => { control.markAsTouched(); });
            return;
        }
        const formData = new FormData();
        formData.append('title', form.value.title);
        formData.append('description', form.value.description);
        formData.append('level', form.value.level);
        formData.append('category', form.value.category);
        formData.append('price', form.value.price);
        formData.append('status', form.value.status ? 'true' : 'false');
        formData.append('liked', form.value.liked ? 'true' : 'false');
        if (form.value.date) formData.append('date', form.value.date);
        if (this.selectedFile) formData.append('file', this.selectedFile);

        this.courseService.addCourse(formData).subscribe({
            next: (response) => {
                console.log('✅ Cours ajouté avec succès !', response);
                this.loadCourses();
                this.closeModal('addCourseModal');
                form.resetForm();
                this.selectedFile = null;
                Swal.fire('Succès!', 'Le cours a été ajouté.', 'success');
            },
            error: (error) => {
                console.error('❌ Erreur lors de l\'ajout du cours :', error);
                Swal.fire('Erreur!', `Erreur lors de l'ajout: ${error.error?.message || error.message || 'Vérifiez la console'}`, 'error');
            }
        });
    }

     handleScheduleCourseSubmit(form: NgForm): void {
      if (form.invalid) {
          Object.values(form.controls).forEach(control => { control.markAsTouched(); });
          Swal.fire('Formulaire incomplet', 'Veuillez remplir tous les champs obligatoires.', 'error');
          return;
      }
      const scheduledDateValue = form.value.scheduledPublishDate;
      if (!scheduledDateValue) {
          Swal.fire('Date manquante', 'La date de publication programmée est obligatoire.', 'warning');
          return;
      }
      const scheduledDate = new Date(scheduledDateValue);
      if (scheduledDate <= new Date()) {
          Swal.fire('Date invalide', 'La date de publication programmée doit être dans le futur.', 'warning');
          return;
      }

      const formData = new FormData();
      formData.append('title', form.value.title || '');
      formData.append('description', form.value.description || '');
      formData.append('level', form.value.level || '');
      formData.append('category', form.value.category || '');
      formData.append('price', (form.value.price !== null && form.value.price !== undefined) ? form.value.price.toString() : '0');
      formData.append('status', 'true'); 
      formData.append('liked', form.value.liked ? 'true' : 'false');
      
      const formattedScheduledDate = scheduledDateValue.replace("T", " ") + ":00";
      formData.append('scheduledPublishDate', formattedScheduledDate);
      
      if (this.selectedFile) { 
        formData.append('file', this.selectedFile); 
      }

      const formDataLog: { [key: string]: any } = {};
      formData.forEach((value, key) => { formDataLog[key] = value; });
      console.log("FormData pour la planification (courses-teachers.ts):", formDataLog);

      this.courseService.scheduleCoursePublication(formData).subscribe({
          next: (response) => {
              this.loadCourses();
              this.closeModal('addCourseWithDateModal');
              Swal.fire({ title: 'Planifié!', text: 'Le cours a été programmé pour publication.', icon: 'success', timer: 2500, showConfirmButton: false });
          },
          error: (error) => {
             console.error('Error scheduling course:', error);
             const backendError = error.error;
             let errorMessage = `La planification a échoué.`;
             if (error.status === 400 && backendError && typeof backendError.detail === 'string' && backendError.detail.includes("Required header 'Authorization' is not present")) {
                 errorMessage = "Session expirée ou token manquant. Veuillez vous reconnecter.";
             } else if (typeof backendError === 'string') { errorMessage += ` Détail: ${backendError}`; } 
             else if (backendError && typeof backendError.message === 'string') { errorMessage += ` Détail: ${backendError.message}`; } 
             else if (error.message) { errorMessage += ` Message: ${error.message}`; }
             Swal.fire('Erreur!', errorMessage, 'error');
         }
      });
    }

    openEditModal(course: Course) {
        this.selectedCourse = {
            ...course,
            date: course.date ? new Date(course.date).toISOString().split('T')[0] : null
        };
        this.selectedFile = null;
        this.isEditModalOpen = true;
        this.cdr.detectChanges();
        setTimeout(() => { this.openModal('editCourseModal'); }, 0);
    }

    handleEditModalClosed(): void {
        this.isEditModalOpen = false;
        this.selectedCourse = {};
        this.selectedFile = null;
        console.log("Edit modal closed and state cleaned via (hidden).");
    }

    handleUpdateCourseSubmit(form: NgForm): void {
        if (form.invalid || !this.selectedCourse?.idCourse) {
            if(form.invalid) { Object.values(form.controls).forEach(control => { control.markAsTouched(); }); }
            if (!this.selectedCourse?.idCourse) { Swal.fire('Erreur', 'ID du cours non trouvé pour la mise à jour.', 'error'); }
            return;
        }
        const updatedData = { ...form.value };
        this.courseService.updateCourse(this.selectedCourse.idCourse, updatedData, this.selectedFile ?? undefined)
            .subscribe({
                next: (response) => {
                    console.log('Course updated:', response);
                    this.loadCourses();
                    this.closeModal('editCourseModal');
                    Swal.fire('Mis à jour!', 'Le cours a été mis à jour.', 'success');
                },
                error: (error) => {
                    console.error('Error updating course:', error);
                    Swal.fire('Erreur!', `Erreur mise à jour: ${error.error?.message || error.message || 'Vérifiez la console'}`, 'error');
                }
            });
    }

    openDeleteConfirmationModal(course: any): void {
        this.courseToDelete = course;
        Swal.fire({
            title: `Supprimer: ${course.title}?`, text: "Cette action est irréversible !", icon: 'warning',
            showCancelButton: true, confirmButtonColor: '#d33', cancelButtonColor: '#3085d6',
            confirmButtonText: 'Oui, supprimer!', cancelButtonText: 'Annuler'
        }).then((result) => {
            if (result.isConfirmed) { this.deleteCourse(); }
            else { this.courseToDelete = null; }
        });
    }

    deleteCourse(): void {
        if (!this.courseToDelete?.idCourse) { console.error("ID cours indéfini!"); return; }
        const courseIdToDelete = this.courseToDelete.idCourse;
        this.courseService.deleteCoursen(courseIdToDelete).subscribe({
            next: (response) => {
                console.log('Server response on delete:', response);
                this.courses = this.courses.filter(c => c.idCourse !== courseIdToDelete);
                this.filteredCourses = this.filteredCourses.filter(c => c.idCourse !== courseIdToDelete);
                Swal.fire('Supprimé!', 'Le cours a été supprimé.', 'success');
                this.courseToDelete = null;
                if (this.pagedCourses().length === 0 && this.currentPage > 1) { this.currentPage--; }
                this.cdr.detectChanges();
            },
            error: (error) => {
                console.error('Error deleting course:', error);
                Swal.fire('Erreur!', `Erreur lors de la suppression: ${error.error || error.message || 'Vérifiez la console'}`, 'error');
                this.courseToDelete = null;
            }
        });
    }

     toggleCourseStatusAlternative(course: any): void {
      // Ajout de stopPropagation ici n'est pas nécessaire
      const courseId = course.idCourse;
      const currentStatus = course.status ?? false;
      const newStatus = !currentStatus;
      const courseIndex = this.courses.findIndex(c => c.idCourse === courseId);
      const courseDataToUpdate = { // Préparer l'objet complet attendu par updateCourse
        idCourse: course.idCourse, title: course.title, description: course.description, level: course.level, category: course.category,
        price: course.price, date: course.date, liked: course.liked, status: newStatus // Seul status change
      };

      // Optimistic UI
      course.status = newStatus;
      if (courseIndex !== -1) this.courses[courseIndex].status = newStatus;
      // Il faut aussi potentiellement mettre à jour filteredCourses si on veut voir le changement immédiatement
      const filteredIndex = this.filteredCourses.findIndex(c => c.idCourse === courseId);
       if (filteredIndex !== -1) this.filteredCourses[filteredIndex].status = newStatus;
      this.cdr.detectChanges();

      // Appel API
      this.courseService.updateCourse(courseId, courseDataToUpdate, undefined).subscribe({
          next: (updatedCourseFromServer) => {
            console.log(`Status updated via updateCourse for ${courseId} to ${newStatus}`);
            // Optionnel : rafraîchir complètement l'objet depuis le serveur
             if (courseIndex !== -1 && updatedCourseFromServer) {
                 const updatedData = {
                     ...updatedCourseFromServer,
                     date: updatedCourseFromServer.date ? new Date(updatedCourseFromServer.date).toISOString().split('T')[0] : null,
                     formattedMonth: updatedCourseFromServer.date ? this.datePipe.transform(updatedCourseFromServer.date, 'MMM', 'UTC', 'fr-FR')?.toUpperCase() : '',
                     formattedDay: updatedCourseFromServer.date ? this.datePipe.transform(updatedCourseFromServer.date, 'd', 'UTC', 'fr-FR') : ''
                 };
                 this.courses.splice(courseIndex, 1, updatedData);
                 this.filteredCourses = [...this.courses]; // Recréer filteredCourses pour la synchro
                 this.searchCourses(); // Réappliquer filtre/tri si l'ordre dépend du statut
             }
          },
          error: (error) => { // Rollback UI
              console.error(`Error using updateCourse for status change on ${courseId}:`, error);
              course.status = currentStatus;
              if (courseIndex !== -1) { this.courses[courseIndex].status = currentStatus; }
               if (filteredIndex !== -1) this.filteredCourses[filteredIndex].status = currentStatus;
              this.cdr.detectChanges();
              Swal.fire('Erreur', "Impossible de changer la visibilité.", 'error');
          }
      });
    }


    onFileSelected(event: any, target: 'add' | 'schedule' | 'edit'): void {
        const file = event.target.files?.[0];
        this.selectedFile = file || null;
    }

    searchCourses() {
        const term = this.searchQuery.toLowerCase().trim();
        if (!term) {
            this.filteredCourses = [...this.courses]; // courses contient déjà uniquement ceux du teacher
        } else {
            this.filteredCourses = this.courses.filter(course =>
                (course.title?.toLowerCase() || '').includes(term) ||
                (course.description?.toLowerCase() || '').includes(term) ||
                (course.category?.toLowerCase() || '').includes(term) ||
                (course.level?.toLowerCase() || '').includes(term)
            );
        }
        this.currentPage = 1;
    }

    startSpeechRecognition() {
        const recognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!recognition) { Swal.fire('Erreur', 'Reconnaissance vocale non supportée par ce navigateur.', 'warning'); return; }
        const speechRecognition = new recognition();
        speechRecognition.lang = 'fr-FR'; speechRecognition.continuous = false; speechRecognition.interimResults = false;
        speechRecognition.start();
        speechRecognition.onresult = (event: any) => {
            this.searchQuery = event.results[0][0].transcript;
            this.searchCourses();
        };
        speechRecognition.onerror = (event: any) => {
            console.error('Erreur SpeechRecognition:', event.error);
            Swal.fire('Erreur Vocale', `Erreur: ${event.error}`, 'error');
        };
    }

    textToSpeech(course: any) {
        if (!window.speechSynthesis) { Swal.fire('Erreur', 'Synthèse vocale non supportée.', 'warning'); return; }
        if (this.isSpeaking) { window.speechSynthesis.cancel(); this.isSpeaking = false; return; }

        const priceText = course.price ? `${course.price} euros` : 'Gratuit';
        const dateText = course.date && this.datePipe ? `Date: ${this.datePipe.transform(course.date, 'longDate', 'UTC', 'fr-FR') || 'Non définie'}` : '';

        const text = `${course.title || 'Titre non disponible'}. Catégorie: ${course.category || 'Non définie'}. Niveau: ${course.level || 'Non défini'}. Description: ${course.description || 'Aucune description'}. ${dateText}. Prix: ${priceText}.`;
        if (!text.trim()) { Swal.fire('Info', 'Pas de texte à lire pour ce cours.', 'info'); return; }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'fr-FR';
        this.isSpeaking = true;
        this.cdr.detectChanges();

        utterance.onend = () => { this.isSpeaking = false; this.cdr.detectChanges(); };
        utterance.onerror = (event) => {
            console.error('TTS Error:', event.error);
            this.isSpeaking = false;
            this.cdr.detectChanges();
            Swal.fire('Erreur TTS', `Erreur de synthèse: ${event.error}`, 'error');
        };
        window.speechSynthesis.speak(utterance);
    }

    toggleFavorite(course: any) {
        const originalLikedStatus = course.liked ?? false;
        const courseId = course.idCourse;

        if (!courseId) {
            console.error("ID du cours indéfini pour toggleFavorite");
            return;
        }
        
        const optimisticNewLikedStatus = !originalLikedStatus;

        // Mise à jour optimiste de l'UI
        const courseIndexInMain = this.courses.findIndex(c => c.idCourse === courseId);
        if (courseIndexInMain !== -1) {
            this.courses[courseIndexInMain].liked = optimisticNewLikedStatus;
        }
        const courseIndexInFiltered = this.filteredCourses.findIndex(c => c.idCourse === courseId);
        if (courseIndexInFiltered !== -1) {
            this.filteredCourses[courseIndexInFiltered].liked = optimisticNewLikedStatus;
        }
        this.cdr.detectChanges();

        const apiCall = optimisticNewLikedStatus 
            ? this.courseService.addToFavorites(courseId)
            : this.courseService.removeFromFavorites(courseId);

        apiCall.subscribe({
            next: (updatedCourseFromServer) => {
                console.log('Like status updated for course:', updatedCourseFromServer);
                // Optionnel: Synchroniser avec la réponse complète du serveur si elle est détaillée
                if (courseIndexInMain !== -1) {
                    this.courses[courseIndexInMain] = {
                        ...this.courses[courseIndexInMain], // Garder les champs formatés etc.
                        ...updatedCourseFromServer, // Écraser avec les données serveur
                        liked: updatedCourseFromServer.liked // S'assurer que 'liked' est bien de la réponse
                    };
                }
                 // Mettre à jour filteredCourses pour refléter le changement immédiatement
                 this.searchCourses(); // ou une mise à jour plus ciblée si possible
            },
            error: error => {
                console.error('Error updating like status', error);
                // Rollback UI
                if (courseIndexInMain !== -1) {
                    this.courses[courseIndexInMain].liked = originalLikedStatus;
                }
                if (courseIndexInFiltered !== -1) {
                    this.filteredCourses[courseIndexInFiltered].liked = originalLikedStatus;
                }
                this.cdr.detectChanges();
                Swal.fire('Erreur', 'Impossible de modifier le statut favori.', 'error');
            }
        });
    }

    pagedCourses(): any[] {
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const sorted = this.sortCoursesForDisplay(this.filteredCourses);
        return sorted.slice(startIndex, startIndex + this.itemsPerPage);
    }

    nextPage() { if (this.currentPage < this.totalPages()) { this.currentPage++; } }
    prevPage() { if (this.currentPage > 1) { this.currentPage--; } }
    totalPages(): number { return Math.ceil(this.filteredCourses.length / this.itemsPerPage); }

    sortCoursesForDisplay(coursesToSort: any[]): any[] {
        return [...coursesToSort].sort((a, b) => {
            const dateA = a.date ? new Date(a.date).getTime() : 0;
            const dateB = b.date ? new Date(b.date).getTime() : 0;
            return dateB - dateA;
        });
    }

    navigateToDetails(course: any): void {
        if (course && course.idCourse) {
            this.router.navigate(['/Admindetailcourses', course.idCourse]); // Pour l'enseignant, peut-être une route différente de celle de l'étudiant ?
        } else {
            console.error("Impossible de naviguer: ID du cours manquant ou cours invalide.", course);
        }
    }
}