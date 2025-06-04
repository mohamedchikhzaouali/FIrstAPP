import { Component, OnInit } from '@angular/core';
import { Course } from 'src/app/Model/CourseModel/Course';
import { CoursesService } from '../../../services/CourseServices/courses.service';
import { AuthService } from 'src/app/AuthService';
import { Observable, Subscription } from 'rxjs'; // Importez Observable et Subscription

@Component({
  selector: 'app-favorit-courses',
  templateUrl: './favorit-courses.component.html',
  styleUrls: ['./favorit-courses.component.scss']
})
export class FavoritCoursesComponent implements OnInit {
  userRole$: Observable<string | null>;

  courses: Course[] = [];
  filteredCourses: any[] = []; // Cours filtrés en fonction de la recherche
  searchQuery: string = ''; // Query pour la recherche
  isSpeaking: boolean = false; // Indique si la lecture vocale est en cours
  courseId!: number;


  constructor(
    private coursesService: CoursesService,
    private authService: AuthService
  ) {
    this.userRole$ = this.authService.userRole$;
  }

  ngOnInit(): void {
    this.userRole$.subscribe(role => {
      console.log('Rôle actuel (AppComponent):', role);});

    // Récupérer les cours favoris
    this.getCourses();
  }

  // Récupérer tous les cours favoris
  getCourses(): void {
    this.coursesService.getCourses().subscribe(
      (courses: Course[]) => {
        // Filtrer les cours favoris (où liked est true)
        this.courses = courses.filter(course => course.liked);
        this.filteredCourses = [...this.courses]; // Assurez-vous que filteredCourses est bien initialisé

      },
      (error) => {
        console.error('Erreur lors de la récupération des cours', error);
      }
    );
  }

  // Retirer un cours des favoris
  removeFromFavorites(courseId: number): void {
    this.coursesService.removeFromFavorites(courseId).subscribe(
      (course: Course) => {
        console.log('Cours retiré des favoris:', course);
        this.getCourses(); // Met à jour la liste des cours après le retrait
      },
      (error) => {
        console.error('Erreur lors du retrait des favoris:', error);
      }
    );
  }
  searchCourses() {
    this.filteredCourses = this.courses.filter(course => 
      course.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
      course.description.toLowerCase().includes(this.searchQuery.toLowerCase())
    );
  }
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
  textToSpeech() {
    // Vérifier la disponibilité de l'API speechSynthesis
    if (!window.speechSynthesis) {
      alert('Text-to-Speech n\'est pas supporté sur ce navigateur.');
      return;
    }

    // Si la synthèse vocale est en cours, on l'arrête
    if (this.isSpeaking) {
      window.speechSynthesis.cancel(); // Arrêter la lecture
      this.isSpeaking = false;
      console.log('🔴 Lecture arrêtée.');
      return;
    }

    // Récupérer tout le texte visible de la page
    const bodyText = document.body.innerText; // Récupérer tout le texte de la page

    // Vérifier que le texte n'est pas vide
    if (!bodyText || bodyText.trim() === '') {
      alert('Il n\'y a pas de texte à lire sur cette page.');
      return;
    }

    // Créer l'énoncé de synthèse vocale
    const utterance = new SpeechSynthesisUtterance(bodyText);
    utterance.lang = 'fr-FR';  // Langue en français

    // Marquer que la lecture est en cours
    this.isSpeaking = true;

    // Événement déclenché lorsque la parole commence
    utterance.onstart = () => {
      console.log('🟢 Lecture en cours...');
    };

    // Événement déclenché lorsque la parole se termine
    utterance.onend = () => {
      console.log('✅ Lecture terminée.');
      this.isSpeaking = false;
    };

    // Gestion des erreurs
    utterance.onerror = (event) => {
      console.error('❌ Erreur lors de la lecture du texte:', event.error);
      this.isSpeaking = false;
    };

    // Lancer la lecture du texte
    window.speechSynthesis.speak(utterance);
  }

  sortedCourses() {
    return (this.filteredCourses.length ? this.filteredCourses : this.courses).sort((a, b) => Number(b.liked) - Number(a.liked));
  }
}
