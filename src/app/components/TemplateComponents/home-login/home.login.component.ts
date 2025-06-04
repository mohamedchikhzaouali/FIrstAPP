import { Component, OnInit, HostListener, AfterViewInit } from '@angular/core'; // Ajout de OnInit
import { Course } from 'src/app/Model/CourseModel/Course';
import { CoursesService } from 'src/app/services/CourseServices/courses.service';
import { Router } from '@angular/router';
import { ReviewService } from 'src/app/services/CourseServices/review.service'; // *** IMPORT AJOUTÉ ***
import { AuthService } from 'src/app/AuthService'; 
import { Observable, Subscription } from 'rxjs'; // Importez Observable et Subscription
declare var $: any; // Déclaration pour éviter l'importation CommonJS


@Component({
  selector: 'app-home-login',
  templateUrl: './home.login.component.html',
  styleUrls: ['./home.login.component.scss']
})
// Ajout de OnInit à implements
export class HomeComponentLogin implements OnInit, AfterViewInit {
  userRole$: Observable<string | null>;

  @HostListener('window:scroll', [])
  onWindowScroll() {
    const header = document.querySelector('.header-area');
    if (header) {
      if (window.scrollY > 50) { // Change à 50px de scroll
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    }
  }

  ngAfterViewInit() {
    $('.owl-service-item').owlCarousel({
      items: 3,
      loop: true,
      dots: true,
      nav: true,
      autoplay: true,
      margin: 30,
      responsive: {
        0: { items: 1 },
        600: { items: 2 },
        1000: { items: 3 }
      }
    });

    $('.owl-courses-item').owlCarousel({
      items: 4,
      loop: true,
      dots: true,
      nav: true,
      autoplay: true,
      margin: 30,
      responsive: {
        0: { items: 1 },
        600: { items: 2 },
        1000: { items: 4 }
      }
    });
  }
  // 'courses' peut être retiré si non utilisé ailleurs dans le template final
  // courses: Course[] = [];
  recommendedCourses: Course[] = []; // Pour les cours recommandés
  // Propriété pour stocker les notes récupérées via ReviewService
  courseRatings: { [id: number]: number } = {}; // *** AJOUTÉ ***

  // Injection de ReviewService dans le constructeur
  constructor(
    private authService: AuthService,
    private courseService: CoursesService,
    private reviewService: ReviewService, // *** AJOUTÉ ***
    private router: Router ) 
  {    
    this.userRole$ = this.authService.userRole$;
  }

  ngOnInit(): void {
    this.userRole$.subscribe(role => {
      console.log('Rôle actuel (AppComponent):', role);});

    // On charge uniquement les cours recommandés au démarrage pour cette section
    this.loadRecommendedCourses();
    // L'appel à getCourses() est retiré d'ici, sauf si nécessaire pour une autre partie du template
    // this.getCourses();
  }


  loadRecommendedCourses(): void {
    // Récupère les cours recommandés (par exemple 6)
    this.courseService.getRecommendedCourses(6).subscribe(courses => {
      console.log('Cours recommandés reçus:', courses);
      this.recommendedCourses = courses;
      // Après avoir reçu les cours, on lance la récupération de leurs notes
      this.fetchRatingsForRecommendedCourses(); // *** APPEL AJOUTÉ ***
    });
  }

  // *** NOUVELLE MÉTHODE pour récupérer les notes via ReviewService ***
  fetchRatingsForRecommendedCourses(): void {
    console.log('Début récupération des notes pour', this.recommendedCourses.length, 'cours.');
    this.recommendedCourses.forEach(course => {
      if (course.idCourse !== undefined) {
        const courseId = course.idCourse;
        // Initialisation (optionnel)
        this.courseRatings[courseId] = 0;
        // Appel au service pour chaque cours
        this.reviewService.getAverageRating(courseId).subscribe({
          next: (rating) => {
            console.log(`Note reçue pour cours ${courseId}:`, rating);
            this.courseRatings[courseId] = rating; // Stockage de la note
          },
          error: (err) => {
            console.error(`Erreur récupération note cours ${courseId}:`, err);
            this.courseRatings[courseId] = 0; // Mettre 0 en cas d'erreur
          }
        });
      } else {
        console.warn("Cours recommandé sans idCourse:", course);
      }
    });
    console.log('Objet courseRatings après lancement des appels:', this.courseRatings);
  }

  // Redirection vers la page de détails (gestion undefined ajoutée)
  navigateToCourseDetails(courseId: number | undefined): void {
    if (courseId !== undefined) {
      this.router.navigate(['/details', courseId]);
    } else {
      console.error("Tentative de navigation avec ID de cours indéfini.");
    }
  }

  // Méthode vide, peut être retirée si non utilisée
  // initOwlCarousel() { }


  // Logique de défilement du carrousel (sélecteur ajusté, vérification existence)
  scrollLeft() {
    const carousel = document.querySelector('.recommended-course-carousel') as HTMLElement; // *** Sélecteur spécifique ***
    if (!carousel) return; // *** Vérification existence ***
    const scrollAmount = 300;
    const currentTransform = parseInt(carousel.style.transform.replace('translateX(', '').replace('px)', '') || '0');
    const newTransform = Math.min(currentTransform + scrollAmount, 0);
    carousel.style.transform = `translateX(${newTransform}px)`;
  }

  scrollRight() {
    const carousel = document.querySelector('.recommended-course-carousel') as HTMLElement; // *** Sélecteur spécifique ***
    if (!carousel) return; // *** Vérification existence ***
    const card = carousel.querySelector('.course-item');
    const cardWidth = card?.clientWidth || 300;
    const gap = 30; // Assurez-vous que cela correspond au padding/marge réel (15px de chaque côté = 30px)
    const scrollAmount = 300;
    // *** FIX: Utilisation de recommendedCourses.length ***
    const maxScroll = Math.max(0, (this.recommendedCourses.length * (cardWidth + gap)) - carousel.clientWidth - gap);

    const currentTransform = parseInt(carousel.style.transform.replace('translateX(', '').replace('px)', '') || '0');
    const newTransform = Math.max(currentTransform - scrollAmount, -maxScroll);
    carousel.style.transform = `translateX(${newTransform}px)`;
  }

}