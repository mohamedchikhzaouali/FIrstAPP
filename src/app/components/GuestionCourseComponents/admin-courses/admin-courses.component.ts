import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CourseCategory } from 'src/app/Model/CourseModel/Coursecategory';
import { CoursesService } from 'src/app/services/CourseServices/courses.service';
import * as bootstrap from 'bootstrap';
import { Modal } from 'bootstrap';
import { Course } from 'src/app/Model/CourseModel/Course';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-admin-courses',
  templateUrl: './admin-courses.component.html',
  styleUrls: ['./admin-courses.component.scss']
})
export class AdminCoursesComponent implements OnInit {

  courses: any[] = []; // Liste des cours
  selectedCourse: any = {}; // Initialisation pour éviter undefined/null
  filteredCourses: any[] = []; // Cours filtrés en fonction de la recherche
  searchQuery: string = ''; // Query pour la recherche
  isSpeaking: boolean = false; // Indique si la lecture vocale est en cours
 
  selectedFile: File | null = null;
  categories = Object.values(CourseCategory) as string[];
  isEditModalOpen = false;  // Par défaut, le modal est caché
  courseData = {
    title: '',
    description: '',
    level: '',
    category: '',
    price: null,
    status: false,
    liked: false,
    scheduledPublishDate: '',
    file: null
  };

  constructor(private courseService: CoursesService, private cdr: ChangeDetectorRef,private http: HttpClient){}

  ngOnInit(): void {
    this.loadCourses();
  }
  
  
  onFileChange(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.courseData.file = file;
    }
  }
  
  
  // Ouvrir la popup d'ajout de cours
    openAddCoursePopup(): void {
      const modal = new bootstrap.Modal(document.getElementById('addCourseModal')!);
      modal.show();
    }

  // Mettre à jour un cours
  updateCourse(): void {
    if (!this.selectedCourse.idCourse) {
      alert('Erreur : ID du cours introuvable.');
      return;
    }
  
    // Vérifier que la catégorie est définie dans le composant
    if (!this.selectedCourse.category || this.selectedCourse.category.trim() === '') {
      alert('Erreur : La catégorie doit être spécifiée.');
      return;
    }
  
    this.courseService.updateCourse(this.selectedCourse.idCourse, this.selectedCourse, this.selectedFile ?? undefined)
      .subscribe({
        next: (response) => {
          console.log('✅ Cours mis à jour avec succès !', response);
          this.loadCourses(); // Recharger les cours après mise à jour
          const modal = bootstrap.Modal.getInstance(document.getElementById('editCourseModal')!);
          modal?.hide(); // Fermer le modal
        },
        error: (error) => {
          console.error('❌ Erreur lors de la mise à jour du cours :', error);
          alert(`Erreur lors de la mise à jour du cours: ${error.message}`);
        }
      });
  }
  
  
  
  
  
  // Ouvrir le modal de modification
  openEditModal(course: Course) {
    this.selectedCourse = { ...course };  // Copiez les informations du cours à modifier
    this.isEditModalOpen = true;          // Ouvre le modal
  }
  closeEditModal() {
    this.isEditModalOpen = false;         // Ferme le modal
  }

  // Gestion du fichier sélectionné
  onFileSelected(event: any): void {
    this.selectedFile = event.target.files[0];
  }

  // Ajouter un cours

  addCourse(formValues: any): void {
    const formData = new FormData();
    formData.append('title', formValues.title);
    formData.append('description', formValues.description);
    formData.append('level', formValues.level);
    formData.append('category', formValues.category);
    formData.append('price', formValues.price);
    formData.append('status', formValues.status ? 'true' : 'false');  // Convertir en String 'true'/'false'
    formData.append('liked', formValues.liked ? 'true' : 'false');    // Convertir en String 'true'/'false'
  
    if (this.selectedFile) {
      formData.append('file', this.selectedFile);
    }
  
    this.courseService.addCourse(formData).subscribe({
      next: (response) => {
        console.log('✅ Cours ajouté avec succès !', response);
        this.loadCourses();
        const modal = bootstrap.Modal.getInstance(document.getElementById('addCourseModal')!);
        modal?.hide();
      },
      error: (error) => {
        console.error('❌ Erreur lors de l\'ajout du cours :', error);
      }
    });
  }
 
  
  
  openAddCourseWithDatePopup(): void {
    const modal = new bootstrap.Modal(document.getElementById('addCourseWithDateModal')!);
    modal.show();
  }
  
  addCourseWithDate(formValues: any): void {
    console.log('Form Values:', formValues); // Debugging
    
    if (!formValues.title || !formValues.description || !formValues.category || !formValues.price || !formValues.level || !formValues.date) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }
  
    const formData = new FormData();
    formData.append('date', formValues.date);
    formData.append('title', formValues.title);
    formData.append('description', formValues.description);
    formData.append('level', formValues.level);
    formData.append('category', formValues.category);
    formData.append('price', formValues.price.toString());
    formData.append('status', formValues.status ? 'true' : 'false');
    formData.append('liked', formValues.liked ? 'true' : 'false');
  
    if (this.selectedFile) {
      formData.append('file', this.selectedFile);
    }
  
    this.courseService.addCourse(formData).subscribe({
      next: (response) => {
        console.log('✅ Cours ajouté avec succès !', response);
        this.loadCourses();
      },
      error: (error) => {
        console.error('❌ Erreur lors de l\'ajout du cours :', error);
        alert(`Erreur lors de l'ajout du cours : ${error.message}`);
      }
    });
  }
  
  
  

  // Charger les cours depuis le backend
  loadCourses() {
    this.courseService.getCourses().subscribe(data => {
      console.log('Données reçues :', data);
      this.courses = data.map(course => ({
        ...course,
        date: course.date ? new Date(course.date).toISOString().split('T')[0] : null,
        title: course.title || 'Titre non disponible',
        category: course.category || 'Catégorie non définie',
        price: course.price || 0,
      }));
      this.filteredCourses = this.courses;  // Initialiser les cours filtrés
    });
  }

  // Fonction de recherche
  searchCourses() {
    this.filteredCourses = this.courses.filter(course => 
      course.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
      course.description.toLowerCase().includes(this.searchQuery.toLowerCase())
    );
  }

  // Fonction de démarrage de la reconnaissance vocale
  startSpeechRecognition() {
    const recognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
  
    if (!recognition) {
      alert('La reconnaissance vocale n\'est pas supportée sur votre navigateur.');
      return;
    }
  
    const speechRecognition = new recognition();
    speechRecognition.lang = 'fr-FR';
    speechRecognition.continuous = false;
    speechRecognition.interimResults = false;
  
    speechRecognition.start();
  
    speechRecognition.onresult = (event: any) => {
      const result = event.results[0][0].transcript;
      this.searchQuery = result;
      this.searchCourses();
    };
  
    speechRecognition.onerror = (event: any) => {
      console.error('Erreur de reconnaissance vocale:', event.error);
    };
  }

  // Méthode Text-to-Speech
  textToSpeech(course: any) {
    if (!window.speechSynthesis) {
      alert('Text-to-Speech n\'est pas supporté sur ce navigateur.');
      return;
    }
  
    if (this.isSpeaking) {
      window.speechSynthesis.cancel();
      this.isSpeaking = false;
      console.log('🔴 Lecture arrêtée.');
      return;
    }
  
    const text = `${course.title}. Description : ${course.description || 'Aucune description disponible'}. Date : ${course.date}. Prix : ${course.price} euros. Niveau : ${course.level}.`;
  
    if (!text.trim()) {
      alert('Il n\'y a pas de texte à lire.');
      return;
    }
  
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'fr-FR';
  
    this.isSpeaking = true;
  
    utterance.onstart = () => console.log('🟢 Lecture en cours...');
    utterance.onend = () => (this.isSpeaking = false);
    utterance.onerror = (event) => {
      console.error('❌ Erreur :', event.error);
      this.isSpeaking = false;
    };
  
    window.speechSynthesis.speak(utterance);
  }

  // Trier les cours
  sortedCourses() {
    return this.filteredCourses.sort((a, b) => Number(b.liked) - Number(a.liked));
  }

  // Gérer le favori
  toggleFavorite(course: any) {
    course.liked = !course.liked;
    this.courses = [...this.courses];
    setTimeout(() => {
      if (course.liked) {
        const element = document.getElementById('course-' + course.idCourse);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    }, 100);
  }

  // Confirmer et supprimer un cours
  confirmerEtSupprimerCours(course: any): void {
    if (!course?.idCourse) {
      console.error("⚠️ ID du cours est indéfini !");
      return;
    }

    if (confirm(`Êtes-vous sûr de vouloir supprimer le cours: ${course.title} ?`)) {
      this.courses = this.courses.filter(c => c.idCourse !== course.idCourse);
      console.log(`✅ Cours avec ID ${course.idCourse} supprimé de l'UI.`);
      this.courseService.deleteCourse(course.idCourse).subscribe({
        next: (response) => {
          console.log('Réponse du serveur:', response);
        },
        error: (error) => {
          console.error('❌ Erreur lors de la suppression du cours :', error);
          this.loadCourses();
        },
        complete: () => {
          console.log("✔️ Suppression terminée !");
        }
      });
    }
  }
}
