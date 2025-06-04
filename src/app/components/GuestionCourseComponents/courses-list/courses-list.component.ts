import { Component, OnInit, OnDestroy, ElementRef, Renderer2, HostListener, NgZone } from '@angular/core';
// FormBuilder, FormGroup ne sont pas utilisés ici, mais pourraient l'être
import { ActivatedRoute, Router } from '@angular/router';
import { Course } from 'src/app/Model/CourseModel/Course'; // Assurez-vous que Course inclut 'scheduledPublishDate?: string | null;'
import { CoursesService } from 'src/app/services/CourseServices/courses.service';
import { ReviewService } from 'src/app/services/CourseServices/review.service';
import { DatePipe, CurrencyPipe } from '@angular/common';
// Ajout des imports RxJS nécessaires pour le polling
import { debounceTime, distinctUntilChanged } from 'rxjs/operators'; // switchMap est déjà importé
import { Subject, Subscription, Observable, interval, startWith, switchMap } from 'rxjs';
import { AuthService } from 'src/app/AuthService';

// Déclaration globale pour API Web Speech/Audio (inchangée)
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
    AudioContext: typeof AudioContext;
    webkitAudioContext: typeof AudioContext;
  }
}

@Component({
  selector: 'app-courses-list', // Sélecteur pour la vue étudiant
  templateUrl: './courses-list.component.html', // Template étudiant
  styleUrls: ['./courses-list.component.scss'],   // SCSS étudiant
  providers: [DatePipe, CurrencyPipe]
})
export class CoursesListComponent implements OnInit, OnDestroy { // Implémenter OnDestroy est déjà fait
  userRole$: Observable<string | null>;

  // --- Propriétés du composant (inchangées) ---
  selectedPriceRange: string = 'all';
  sortOption: string = 'default';
  selectedCategory: string = 'all';
  courses: Course[] = []; // Tableau source complet (sera mis à jour par polling)
  filteredCourses: Course[] = []; // Tableau filtré/trié pour affichage
  searchQuery: string = '';
  isSpeaking: boolean = false; // Pour Text-to-Speech
  currentPage: number = 1;
  itemsPerPage: number = 6;
  filter: 'all' | 'favorites' = 'all'; // Filtre principal All/Favorites
  averageRating: { [idCourse: number]: number } = {};
  suggestions: any[] = [];
  showSuggestions: boolean = false;
  highlightedSuggestion: any = null;
  private searchTerms = new Subject<string>();
  private mouseOverSuggestions = false;
  totalCourses: number = 0;

  // --- Propriétés Modal Vocal (inchangées) ---
  isVoiceModalOpen = false;
  currentTranscript = '';
  finalTranscript = '';
  voiceError = '';
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private microphoneSource: MediaStreamAudioSourceNode | null = null;
  private audioStream: MediaStream | null = null;
  private dataArray: Uint8Array | null = null;
  private animationFrameId: number | null = null;
  private recognition: any | null = null;
  private isRecognitionActive = false;

  // --- Abonnements RxJS ---
  private searchSubscription: Subscription | null = null;
  // Remplacer courseServiceSubscription par timerSubscription pour le polling
  private timerSubscription: Subscription | null = null;

  constructor(
    private courseService: CoursesService,
    private reviewService: ReviewService,
    // private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private el: ElementRef,
    private renderer: Renderer2,
    private datePipe: DatePipe,
    private currencyPipe: CurrencyPipe,
    private zone: NgZone,
    private authService: AuthService
  ) {
    this.userRole$ = this.authService.userRole$;
  }

  ngOnInit(): void {
    this.userRole$.subscribe(role => {
      console.log('Rôle actuel (AppComponent):', role);});
      
    // Remplacer l'appel direct à loadCourses par le démarrage du polling
    this.setupPolling();
    this.setupSearch(); // Garder la configuration de la recherche
    this.setupSpeechRecognition(); // Garder la configuration vocale
  }

  ngOnDestroy(): void {
    this.searchSubscription?.unsubscribe();
    // Se désabonner du polling
    this.timerSubscription?.unsubscribe();
    this.stopVisualizationAndRecognition(); // Garder le cleanup vocal/visu
    if (this.audioStream) { this.audioStream.getTracks().forEach(t => t.stop()); }
    if (this.recognition) { this.recognition.abort(); }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(e => console.error("Error closing AudioContext", e));
    }
  }

  // --- Nouvelle Méthode pour le Polling ---
  setupPolling(): void {
    // Poll toutes les 60 secondes (ajustez si nécessaire)
    this.timerSubscription = interval(60000)
      .pipe(
        startWith(0), // Charger immédiatement au début
        switchMap(() => this.courseService.getCourses())
      )
      .subscribe(
        allCourses => {
          console.log('Polling: Fetched courses from service.'); // Log de débogage
          this.courses = allCourses.map(course => ({
            ...course,
            liked: course.liked ?? false,
            status: course.status ?? false
          }));
          this.courses.forEach(course => {
            if (course.idCourse && this.averageRating[course.idCourse] === undefined) {
              this.loadAverageRatingForCourse(course.idCourse);
            }
          });
          this.filterCourses(); // Appliquer les filtres initiaux
        },
        (error) => {
            console.error('Erreur lors du polling des cours:', error);
        }
      );
  }

  // --- Chargement des notes (inchangé) ---
  loadAverageRatingForCourse(idCourse: number): void {
    this.reviewService.getAverageRating(idCourse).subscribe(rating => {
      this.averageRating[idCourse] = Number(rating.toFixed(1));
      // Potentiellement appeler filterCourses() ici si le tri dépend de la note et doit être immédiat
    });
  }

  // --- MODIFICATION MAJEURE : Filtrage & Tri (AVEC LOGS) ---
  filterCourses(): void {
    if (!this.courses || this.courses.length === 0) { // Vérifier aussi si courses a été chargé
        console.warn("filterCourses called before courses were loaded or courses array is empty.");
        this.filteredCourses = [];
        this.totalCourses = 0;
        this.updateSuggestions(''); // Nettoyer suggestions si pas de cours
        // Reset pagination if needed
        if(this.currentPage !== 1) this.currentPage = 1;
        return;
    }
    let filtered = [...this.courses];
    const now = new Date();

    // ----- LOGIQUE DE FILTRAGE SIMPLIFIÉE -----
    filtered = filtered.filter(course => {
        const scheduledDate = course.scheduledPublishDate ? new Date(course.scheduledPublishDate) : null;
        const isTimeForPublication = !scheduledDate || scheduledDate <= now;
        const isStatusTrue = course.status === true;
        return isTimeForPublication && isStatusTrue;
    });
    console.log(`[FILTER] Après filtre statut/date: ${filtered.length} cours.`); // LOG 1

    // Appliquer les autres filtres UI
    if (this.filter === 'favorites') {
      const countBefore = filtered.length;
      filtered = filtered.filter(course => course.liked);
      console.log(`[FILTER] Après filtre favoris: ${filtered.length} cours (était ${countBefore}).`); // LOG 2
    }

    if (this.selectedCategory !== 'all') {
      const countBefore = filtered.length;
      filtered = filtered.filter(course => course.category?.toLowerCase() === this.selectedCategory.toLowerCase());
      console.log(`[FILTER] Après filtre catégorie (${this.selectedCategory}): ${filtered.length} cours (était ${countBefore}).`); // LOG 3
    }

    if (this.selectedPriceRange !== 'all') {
       const countBefore = filtered.length;
       filtered = filtered.filter(course => {
          const price = course.price ?? 0;
          switch (this.selectedPriceRange) {
            case 'free': return price === 0;
            case 'under50': return price > 0 && price < 50;
            case '50to100': return price >= 50 && price <= 100;
            case 'above100': return price > 100;
            default: return true;
          }
       });
       console.log(`[FILTER] Après filtre prix (${this.selectedPriceRange}): ${filtered.length} cours (était ${countBefore}).`); // LOG 4
    }

    // --- Application du filtre recherche ---
    const searchTerm = this.searchQuery.trim().toLowerCase();
    console.log(`[FILTER] Terme de recherche utilisé: '${searchTerm}'`); // LOG 5
    const countBeforeSearch = filtered.length;
    console.log(`[FILTER] Nombre de cours AVANT filtre recherche: ${countBeforeSearch}`); // LOG 6

    if (searchTerm) {
      // Appliquer le filtre recherche
      filtered = filtered.filter(course => this.courseMatchesSearch(course, searchTerm));
      console.log(`[FILTER] Nombre de cours APRES filtre recherche: ${filtered.length}`); // LOG 7
    } else {
      console.log("[FILTER] Aucun terme de recherche, filtre recherche non appliqué."); // LOG 8
    }

    // Trier les cours filtrés
    this.sortCourses(filtered); // Tri sur le tableau filtré

    // Assignation finale
    this.filteredCourses = filtered;
    console.log("[FILTER] Assignation finale à filteredCourses effectuée."); // LOG 9
    this.totalCourses = filtered.length;

    // Ajuster la page courante si nécessaire
    const totalPgs = this.totalPages(); // Recalculer basé sur filteredCourses.length
    if(this.currentPage > totalPgs && totalPgs > 0) {
        console.log(`[PAGINATION] Current page ${this.currentPage} is out of bounds (${totalPgs}), resetting to ${totalPgs}`);
        this.currentPage = totalPgs;
    } else if (totalPgs === 0 && this.currentPage !== 1) {
         console.log(`[PAGINATION] No results, resetting to page 1`);
         this.currentPage = 1;
    } else if (this.currentPage < 1) {
        console.log(`[PAGINATION] Current page ${this.currentPage} is invalid, resetting to 1`);
        this.currentPage = 1;
    }

    this.updateSuggestions(this.searchQuery);
  }


  // Tri pour étudiant (inchangé)
  sortCourses(courses: Course[]): void {
    courses.sort((a, b) => {
      const aLiked = a.liked ?? false; const bLiked = b.liked ?? false;
      if (this.filter === 'all') {
           if (aLiked && !bLiked) return -1;
           if (!aLiked && bLiked) return 1;
      }
      switch (this.sortOption) {
        case 'priceAsc': return (a.price ?? 0) - (b.price ?? 0);
        case 'priceDesc': return (b.price ?? 0) - (a.price ?? 0);
        case 'popularity': return 0;
        case 'rating':
          const ratingA = this.averageRating[a.idCourse] || 0;
          const ratingB = this.averageRating[b.idCourse] || 0;
          return ratingB - ratingA;
        default: return 0;
      }
    });
  }

  // --- Recherche & Suggestions ---
  setupSearch(): void {
    this.searchSubscription = this.searchTerms.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(term => { // On peut récupérer le terme ici si besoin, mais filterCourses utilise this.searchQuery
        console.log(`[SEARCH] Debounced search term: '${term}', triggering filterCourses()`);
        this.filterCourses(); // Appelle filterCourses après debounce
    });
  }

  onSearchInput(): void {
    // Envoie la valeur ACTUELLE de searchQuery au Subject
    this.searchTerms.next(this.searchQuery);
    // Ne pas appeler filterCourses directement ici à cause du debounce
    // L'appel à updateSuggestions est maintenant à la fin de filterCourses
  }

  updateSuggestions(term: string): void {
    const searchTerm = term.toLowerCase().trim();
    if (!searchTerm) {
      this.suggestions = [];
      this.showSuggestions = false;
      return;
    }
    const now = new Date();
    // Baser les suggestions sur les cours potentiellement visibles (mêmes premières étapes que filterCourses)
    const potentialCourses = this.courses.filter(course => {
      const scheduledDate = course.scheduledPublishDate ? new Date(course.scheduledPublishDate) : null;
      const isTimeForPublication = !scheduledDate || scheduledDate <= now;
      const isStatusTrue = course.status === true;
      return isTimeForPublication && isStatusTrue;
    });

    this.suggestions = potentialCourses
        .filter(c => this.courseMatchesSearch(c, searchTerm))
        .map(c => ({ id: c.idCourse, title: c.title }))
        .slice(0, 10);

    this.showSuggestions = this.suggestions.length > 0 && term === this.searchQuery; // Afficher seulement si le terme correspond toujours
  }

  // courseMatchesSearch: Doit être robuste aux champs potentiellement null/undefined
  courseMatchesSearch(course: any, searchTerm: string): boolean {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      const fieldsToSearch = [
          course.title,
          course.description,
          course.category,
          course.level
      ];
      const match = fieldsToSearch.some(field => field && field.toString().toLowerCase().includes(term));
      // console.log(`-- Matching '${term}' in course ${course.idCourse} (${course.title})? ${match}`); // LOG Optionnel (décommenter si besoin)
      return match;
  }


  // selectSuggestion, hideSuggestionsList, onSearchFocus, onSearchBlur, etc. (Inchangés)
  selectSuggestion(suggestion: any): void { this.searchQuery = suggestion.title; this.hideSuggestionsList(); this.filterCourses(); }
  hideSuggestionsList(): void { setTimeout(() => { this.showSuggestions = false; this.highlightedSuggestion = null; }, 150); }
  onSearchFocus(): void { if (this.searchQuery.trim()) { this.updateSuggestions(this.searchQuery); } }
  onSearchBlur(): void { if (!this.mouseOverSuggestions) { this.hideSuggestionsList(); } }
  onMouseEnterSuggestions(): void { this.mouseOverSuggestions = true; }
  onMouseLeaveSuggestions(): void { this.mouseOverSuggestions = false; }
  highlightSuggestion(suggestion: any): void { this.highlightedSuggestion = suggestion; }
  @HostListener('document:click', ['$event'])
  clickout(event: Event): void {
      const target = event.target as Node;
      const searchBar = this.el.nativeElement.querySelector('.search-bar');
      const suggestionsList = this.el.nativeElement.querySelector('.suggestions-list');
      if (searchBar && !searchBar.contains(target) && (!suggestionsList || !suggestionsList.contains(target))) {
          this.showSuggestions = false;
          this.highlightedSuggestion = null;
      }
  }


  // --- Actions UI (Étudiant) Inchangées ---
  setFilter(filter: 'all' | 'favorites'): void { this.filter = filter; this.currentPage = 1; this.filterCourses(); }
  handlePriceChange(): void { this.currentPage = 1; this.filterCourses(); }
  onSortOptionChange(sortOption: string): void { this.sortOption = sortOption; this.filterCourses(); } // Pas besoin de passer sortOption ici, filterCourses lit this.sortOption

  // --- Gestion Favoris (Étudiant) Inchangée ---
  toggleFavorite(course: any): void {
    const previousLikedState = course.liked ?? false;
    const courseId = course.idCourse;
    if (!courseId) return;

    const courseIndexInSource = this.courses.findIndex(c => c.idCourse === courseId);
    const courseIndexInFiltered = this.filteredCourses.findIndex(c => c.idCourse === courseId);

    if (courseIndexInSource !== -1) { this.courses[courseIndexInSource].liked = !previousLikedState; }
    if (courseIndexInFiltered !== -1) { this.filteredCourses[courseIndexInFiltered].liked = !previousLikedState; }

    const apiCall = !previousLikedState
        ? this.courseService.addToFavorites(courseId)
        : this.courseService.removeFromFavorites(courseId);

    apiCall.subscribe({
        next: (response: any) => {
            console.log(`Favorite status updated for ${courseId}:`, response);
            if (response && typeof response === 'object' && response.idCourse && courseIndexInSource !== -1) {
                 const currentStatus = this.courses[courseIndexInSource].status;
                 this.courses[courseIndexInSource] = { ...this.courses[courseIndexInSource], ...response, liked: !previousLikedState, status: response.status ?? currentStatus };
            }
            this.filterCourses(); // Réappliquer filtres/tri après changement favori
        },
        error: (error) => {
            console.error("Error updating favorite status:", error);
            if (courseIndexInSource !== -1) { this.courses[courseIndexInSource].liked = previousLikedState; }
            if (courseIndexInFiltered !== -1) { this.filteredCourses[courseIndexInFiltered].liked = previousLikedState; }
            // Notifier l'utilisateur
        }
    });
  }


  // --- Pagination (Inchangée) ---
  paginatedCourses(): Course[] { const start = (this.currentPage - 1) * this.itemsPerPage; return this.filteredCourses.slice(start, start + this.itemsPerPage); }
  totalPages(): number { return Math.ceil(this.filteredCourses.length / this.itemsPerPage); }
  getPages(): number[] { const totalPgs = this.totalPages(); return totalPgs > 0 ? Array(totalPgs).fill(0).map((_, i) => i + 1) : []; }
  goToPage(page: number): void { if (page >= 1 && page <= this.totalPages()) this.currentPage = page; }
  nextPage(): void { if (this.currentPage < this.totalPages()) this.currentPage++; }
  prevPage(): void { if (this.currentPage > 1) this.currentPage--; }

  // --- Text to Speech & Modal Vocal (Inchangés - Collés depuis version précédente) ---
  textToSpeech(course: any): void {
     if (!window.speechSynthesis) { alert('TTS non supporté.'); return; }
     if (this.isSpeaking) {
         window.speechSynthesis.cancel();
         this.isSpeaking = false;
         return;
     }
     const text = `${course.title}. ${course.description || 'Aucune description.'}. Catégorie ${course.category || 'non définie'}. Prix ${course.price ? this.currencyPipe.transform(course.price, 'EUR', 'symbol', '1.2-2', 'fr-FR') : 'Gratuit'}. Niveau ${course.level || 'non défini'}.`;
     const utterance = new SpeechSynthesisUtterance(text);
     utterance.lang = 'fr-FR';
     utterance.onstart = () => { this.zone.run(() => this.isSpeaking = true); };
     utterance.onend = () => { this.zone.run(() => this.isSpeaking = false); };
     utterance.onerror = (event) => {
         this.zone.run(() => this.isSpeaking = false);
         console.error('TTS Error:', event.error);
     };
     window.speechSynthesis.speak(utterance);
    }

  openVoiceModal(): void {
     this.isVoiceModalOpen = true; this.currentTranscript = ''; this.finalTranscript = ''; this.voiceError = '';
     setTimeout(() => { this.startVisualizationAndRecognition(); }, 100);
    }

  closeVoiceModal(): void {
     this.isVoiceModalOpen = false; this.stopVisualizationAndRecognition();
    }

  setupSpeechRecognition(): void {
     const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
     if (!SpeechRecognition) { console.error('Speech Recognition non supporté.'); return; }

     this.recognition = new SpeechRecognition();
     this.recognition.lang = 'fr-FR';
     this.recognition.continuous = false;
     this.recognition.interimResults = true;

     this.recognition.onresult = (event: any) => {
       let interim = '', final = '';
       for (let i = event.resultIndex; i < event.results.length; ++i) {
         if (event.results[i].isFinal) {
           final += event.results[i][0].transcript;
         } else {
           interim += event.results[i][0].transcript;
         }
       }
       this.zone.run(() => {
         this.currentTranscript = interim;
         if (final) {
           this.finalTranscript = final.trim();
           if (this.isVoiceModalOpen) {
             this.searchQuery = this.finalTranscript;
             this.filterCourses();
             this.closeVoiceModal();
           }
         }
       });
     };

     this.recognition.onerror = (event: any) => {
       this.zone.run(() => {
         let errorMsg = `Erreur de reconnaissance: ${event.error}`;
         if (event.error === 'no-speech') errorMsg = 'Aucun son détecté. Veuillez réessayer.';
         else if (event.error === 'audio-capture') errorMsg = "Problème de capture audio. Vérifiez votre microphone.";
         else if (event.error === 'not-allowed') errorMsg = "Accès au microphone refusé.";
         this.voiceError = errorMsg;
         this.stopVisualizationAndRecognition();
         setTimeout(() => { if(this.isVoiceModalOpen) this.closeVoiceModal(); }, 2500);
       });
     };

     this.recognition.onend = () => {
       this.zone.run(() => { this.isRecognitionActive = false; });
     };
    }

  async startVisualizationAndRecognition(): Promise<void> {
     if (this.isRecognitionActive || !this.recognition) return;

     try {
       this.audioStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
       const AudioContext = window.AudioContext || window.webkitAudioContext;
       if (!this.audioContext || this.audioContext.state === 'closed') {
            this.audioContext = new AudioContext();
       } else if (this.audioContext.state === 'suspended') {
           await this.audioContext.resume();
       }

       this.analyser = this.audioContext.createAnalyser();
       this.analyser.fftSize = 256;

       this.microphoneSource = this.audioContext.createMediaStreamSource(this.audioStream);
       this.microphoneSource.connect(this.analyser);

       const bufferLength = this.analyser.frequencyBinCount;
       this.dataArray = new Uint8Array(bufferLength);

       this.visualizeVoice();
       this.isRecognitionActive = true;
       this.voiceError = '';
       this.recognition.start();
       console.log('Reconnaissance vocale démarrée.');

     } catch (err: any) {
       console.error('Erreur accès micro / démarrage reconnaissance:', err);
       this.zone.run(() => {
         if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
             this.voiceError = "Accès au microphone refusé.";
         } else {
             this.voiceError = "Erreur d'accès au microphone.";
         }
       });
       this.closeVoiceModal();
     }
    }

  visualizeVoice(): void {
     if (!this.analyser || !this.dataArray || !this.isVoiceModalOpen || !this.audioContext || this.audioContext.state !== 'running') {
         if (this.animationFrameId) { cancelAnimationFrame(this.animationFrameId); this.animationFrameId = null; }
         return;
     }

     this.analyser.getByteFrequencyData(this.dataArray);
     let sum = 0;
     this.dataArray.forEach(v => sum += v);
     const average = this.dataArray.length > 0 ? sum / this.dataArray.length : 0;

     const scale = 1 + (average / 128);
     const clampedScale = Math.min(Math.max(scale, 1), 2.0);

     const circle = this.el.nativeElement.querySelector('#voice-visualization-circle');
     if (circle) {
       this.renderer.setStyle(circle, 'transform', `scale(${clampedScale})`);
     }
     this.animationFrameId = requestAnimationFrame(() => this.visualizeVoice());
    }

  stopVisualizationAndRecognition(): void {
     if (this.animationFrameId) {
       cancelAnimationFrame(this.animationFrameId);
       this.animationFrameId = null;
     }
     if (this.recognition && this.isRecognitionActive) {
       this.recognition.stop();
     }
     this.isRecognitionActive = false;

     if (this.microphoneSource) {
       this.microphoneSource.disconnect();
       this.microphoneSource = null;
     }
     this.analyser = null;

     if (this.audioStream) {
       this.audioStream.getTracks().forEach(track => track.stop());
       this.audioStream = null;
     }

     const circle = this.el.nativeElement.querySelector('#voice-visualization-circle');
     if (circle) {
       this.renderer.setStyle(circle, 'transform', 'scale(1)');
     }
    }

} // Fin de la classe CoursesListComponent