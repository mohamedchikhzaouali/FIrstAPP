import { Component, OnInit, OnDestroy } from '@angular/core';

import { Router } from '@angular/router';
import { TranslationService } from '../../../services/ArticleService/translation.service';
import { Injectable } from '@angular/core';

import { ChatbotService } from '../../../services/ArticleService/chatbot.service';
import { ViewChild, ElementRef } from '@angular/core';
import { Article } from 'src/app/Model/article';
import { ReadLater } from 'src/app/Model/read-later';
import { ArticleServiceService } from 'src/app/services/ArticleService/article-service.service';
import { TextToSpeechService } from 'src/app/services/ArticleService/text-to-speech.service copy';
import { FavoriteService } from 'src/app/services/ArticleService/favorite.service';
import { ReadLaterService } from 'src/app/services/ArticleService/read-later.service';
import { Favorite } from 'src/app/Model/favorite';
import { Ressource } from 'src/app/Model/ressource';
import { AuthService } from 'src/app/AuthService';
import { interval, Observable, Subscription, switchMap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
@Component({
  selector: 'app-article',
  templateUrl: './article.component.html',
  styleUrls: ['./article.component.scss']
})
export class ArticleComponent implements OnInit, OnDestroy {
  searchText: string = '';
  filteredArticles: Article[] = [];
  articles: Article[] = [];
  showAddForm = false;
  userId: number = 1; // Replace with actual user ID
  favoriteArticleIds: number[] = [];
  showReactionsPanel: { [articleId: number]: boolean } = {}; // Control visibility of reaction panel
  showReadLaterModal = false;

   userRole$: Observable<string | null>;

  // Changed properties
  readLaterItems: ReadLater[] = []; // Changed from readLaterArticleIds to store full items
  selectedArticleForReadLater: Article | null = null; // Changed to store full article
  reminderDate: string = '';
 
  // New properties for notifications
  notifications: ReadLater[] = [];
  showNotifications = false;

  // Add missing properties
  currentUserReactions: { [articleId: number]: string | null } = {}; // Track user reaction per article
  availableReactions: string[] = ["like", "love", "haha", "wow", "sad", "angry"];

  newArticle: Article = {
    title: '',
    date: new Date().toISOString().split('T')[0],
    categorie: 'NEWS',
    status: true,
    views: 0,
    numberShares: 0,
    ressources: [],
    user: { id: 1 },
    published: false,
    scheduled: false,
    publicationStatus: 'DRAFT'
  };

  newResource: Ressource = {
    description: '',
    video: '',
    pdf: '',
    picture: ''
  };

  loading = false;
  error: string | null = null;
  selectedCategorie: 'ALL' | 'NEWS' | 'SUCCESS_STORY' | 'BLOG' = 'ALL';
  sourceLang: string = 'fr';
  targetLang: string = 'en';
  searchPlaceholder: string = 'Search by title...';

  // Add chatbot-related properties
  showAnalysisModal = false;
  selectedArticleForAnalysis: Article | null = null;
  analysisResult: any = null;
  analysisLoading = false;

  // Chatbot properties
  showChatbot = false;
  botMessages: { content: string; isUser: boolean; timestamp: Date; data?: any }[] = [];
  chatbotInput = '';
  isChatbotTyping = false;
  @ViewChild('chatMessages') private chatMessagesContainer!: ElementRef;

  // Add these properties
  showBackToTop = false;

  // Add WebSocket subscription
  private notificationSubscription: Subscription | null = null;

  constructor(
    private articleService: ArticleServiceService,
    private router: Router,
    private translationService: TranslationService,
    private textToSpeechService: TextToSpeechService,
    private favoriteService: FavoriteService,
    private readLaterService: ReadLaterService,
    private chatbotService: ChatbotService,
        private authService: AuthService
 // Add chatbot service
  ) {         this.userRole$ = this.authService.userRole$;
}

  ngOnInit(): void {
    this.userRole$.subscribe(role => {
            console.log('Rôle actuel (AppComponent):', role);
        });
    console.log('Article component initialized');
    this.sourceLang = localStorage.getItem('sourceLanguage') || 'fr';
    this.targetLang = localStorage.getItem('targetLanguage') || 'en';
    this.translationService.setLanguages(this.sourceLang, this.targetLang);
    this.loadArticles();
    this.loadUserFavorites(); // Load user's favorites on initialization
    this.loadReadLater(); // Changed from loadUserReadLater
    this.checkNotifications(); // Add initial notification check
    this.setupNotificationPolling();
     // Use polling instead of WebSocket
   
    const searchInput = document.querySelector('input[type="text"]');
    if (searchInput) {
      searchInput.setAttribute('placeholder', this.searchPlaceholder);
      searchInput.classList.add('translate-placeholder');
    }
   
    // Initialize chatbot with a welcome message
    this.botMessages.push({
      content: 'Hello! I am your BrainWave assistant. How can I help you with articles today?',
      isUser: false,
      timestamp: new Date()
    });

    // Initialize back to top button logic
    window.addEventListener('scroll', this.checkScrollPosition.bind(this));
  }

  ngOnDestroy(): void {
    // Clean up subscriptions
    if (this.notificationSubscription) {
      this.notificationSubscription.unsubscribe();
    }
   
    this.readLaterService.stopNotificationPolling();
   
    window.removeEventListener('scroll', this.checkScrollPosition.bind(this));
  }

  onLanguageChange(source: string, target: string) {
    try {
      // Garder la langue actuelle comme source
      const currentSource = this.sourceLang;

      // Mettre à jour la langue source avec la langue cliquée
      this.sourceLang = source;

      // La langue cible devient la langue sur laquelle on clique
      this.targetLang = source;

      // Configurer le service de traduction
      this.translationService.setLanguages(currentSource, source);

      // Traduire la page
      const elementsToTranslate = document.querySelectorAll('.translate');
      this.translationService.translatePage(elementsToTranslate);
    } catch (error) {
      console.error(error);
    }
  }

  loadArticles(): void {
    this.loading = true;
    this.error = null;
    this.articleService.getAllArticles().subscribe({
      next: (articles) => {
        this.articles = articles;
        this.filteredArticles = [...this.articles];
        this.loading = false;
        this.filteredArticles.forEach(article => {
          if (article.id !== undefined) {
            this.loadReactions(article.id);
            this.loadUserReaction(article.id, this.userId);
            this.showReactionsPanel[article.id] = false; // Initialize panel visibility
          }
        });
        setTimeout(() => {
          const elementsToTranslate = document.querySelectorAll('.translate');
          this.translationService.translatePage(elementsToTranslate);
        }, 100);
      },
      error: (error) => {
        console.error('Error loading articles:', error);
        this.error = 'Error loading articles';
        this.loading = false;
      }
    });
  }

  filterArticles(): void {
    this.filteredArticles = this.articles.filter(article => {
      // Filtre par catégorie
      const categoryMatch = this.selectedCategorie === 'ALL' ||
                          article.categorie === this.selectedCategorie;

      // Filtre par recherche
      const searchMatch = !this.searchText ||
                          article.title.toLowerCase().includes(this.searchText.toLowerCase());

      return categoryMatch && searchMatch;
    });
  }

  onCategorieChange(categorie: 'ALL' | 'NEWS' | 'SUCCESS_STORY' | 'BLOG'): void {
    this.selectedCategorie = categorie;
    this.filterArticles();
  }

  addResource(): void {
    if (!this.newArticle.ressources) {
      this.newArticle.ressources = [];
    }
    this.newArticle.ressources.push({...this.newResource});
    this.newResource = {
      description: '',
      video: '',
      pdf: '',
      picture: ''
    };
  }

  removeResource(index: number): void {
    if (this.newArticle.ressources) {
      this.newArticle.ressources.splice(index, 1);
    }
  }

  onSubmit(): void {
    console.log('Submitting article:', this.newArticle);
    this.articleService.createArticle(this.newArticle).subscribe({
      next: (response: Article) => {
        console.log('Article created successfully:', response);
        this.loadArticles();
        this.showAddForm = false;
        this.resetNewArticle();
        window.location.reload();
      },
      error: (error) => {
        console.error('Error creating article:', error);
        alert('Error creating article: ' + error.message);
      }
    });
  }

  deleteArticle(id: number | undefined): void {
    if (id && confirm('Are you sure you want to delete this article?')) {
      this.articleService.deleteArticle(id).subscribe({
        next: () => {
          this.loadArticles();
        },
        error: (error) => {
          console.error('Error deleting article:', error);
          alert('Error deleting article');
        }
      });
    }
  }

  editArticle(id: number | undefined): void {
    if (id) {
      this.router.navigate(['/articles/edit', id]);
    }
  }

  private resetNewArticle(): void {
    this.newArticle = {
      title: '',
      date: new Date().toISOString().split('T')[0],
      categorie: 'NEWS',
      status: true,
      views: 0,
      numberShares: 0,
      ressources: [],
      user: { id: 1 },
      published: false,
      scheduled: false,
      publicationStatus: 'DRAFT'
    };
    this.newResource = {
      description: '',
      video: '',
      pdf: '',
      picture: ''
    };
  }
  onArticleClick(article: any): void {
    if (article.id) {
      this.articleService.incrementView(article.id).subscribe({
        next: () => {
          article.views += 1;
          // No need to navigate here, as the routerLink in the template will handle it.
        },
        error: err => console.error('Erreur lors de l’incrémentation des vues:', err)
      });
    }
  }

  speakDescription(description: string): void {
    this.textToSpeechService.speak(description);
  }
  addFavorite(articleId: number): void {
    if (!this.isFavorite(articleId)) {
      this.favoriteService.addFavorite(this.userId, articleId).subscribe({
        next: (response) => {
          console.log('Article added to favorites', response);
          // Add the article ID to the favorites array
          this.favoriteArticleIds.push(articleId);
        },
        error: (error) => {
          console.error('Error adding article to favorites', error);
        }
      });
    } else {
      console.log('Article is already in favorites');
    }
  }

  toggleFavorite(articleId: number | undefined): void {
    if (articleId !== undefined) {
      if (this.isFavorite(articleId)) {
        // Find the favorite ID from the favorites list
        this.favoriteService.getFavoriteArticles(this.userId).subscribe({
          next: (favorites: Favorite[]) => {
            // Find the favorite entry for this article
            const favorite = favorites.find(fav =>
              fav.articles && fav.articles.length > 0 && fav.articles[0].id === articleId
            );
           
            if (favorite && favorite.id) {
              // Now remove using the favorite ID
              this.favoriteService.removeFavorite(favorite.id).subscribe({
                next: () => {
                  console.log('Article removed from favorites');
                  this.favoriteArticleIds = this.favoriteArticleIds.filter(id => id !== articleId);
                },
                error: (err) => console.error('Error removing favorite:', err)
              });
            }
          },
          error: (err) => console.error('Error finding favorite item:', err)
        });
      } else {
        this.favoriteService.addFavorite(this.userId, articleId).subscribe({
          next: () => {
            console.log('Article added to favorites');
            this.favoriteArticleIds.push(articleId);
          },
          error: (err) => console.error('Error adding favorite:', err)
        });
      }
    } else {
      console.error('Article ID is undefined');
    }
  }

  isFavorite(articleId: number): boolean {
    return this.favoriteArticleIds.includes(articleId);
  }

  loadReactions(articleId: number): void { // Ensure articleId is always a number here
    this.articleService.getArticleReactions(articleId).subscribe(
      (counts: { [key: string]: number }) => {
        this.reactionCounts[articleId] = counts;
      },
      (error) => {
        console.error('Error fetching reactions for article', articleId, ':', error);
      }
    );
  }

  loadUserReaction(articleId: number, userId: number): void { // Ensure articleId is always a number here
    this.articleService.getUserReaction(articleId, userId).subscribe(
      (reaction) => {
        this.currentUserReactions[articleId] = reaction;
      },
      (error) => {
        console.error('Error fetching user reaction for article', articleId, ':', error);
      }
    );
  }

  react(articleId: number, reactionType: string): void { // Ensure articleId is always a number here
    this.articleService.reactArticle(articleId, this.userId, reactionType).subscribe(
      () => {
        this.loadReactions(articleId);
        this.loadUserReaction(articleId, this.userId);
      },
      (error) => {
        console.error('Error reacting to article', articleId, 'with', reactionType, ':', error);
      }
    );
  }

  unreact(articleId: number): void { // Ensure articleId is always a number here
    this.articleService.unreactArticle(articleId, this.userId).subscribe(
      () => {
        this.loadReactions(articleId);
        this.loadUserReaction(articleId, this.userId);
      },
      (error) => {
        console.error('Error unreacting to article', articleId, ':', error);
      }
    );
  }

  toggleReactionsPanel(articleId: number | undefined): void {
    if (articleId !== undefined) {
      this.showReactionsPanel[articleId] = !this.showReactionsPanel[articleId];
    }
  }

  // Load user's favorite articles
  loadUserFavorites(): void {
    this.favoriteService.getFavoriteArticles(this.userId).subscribe({
      next: (favorites: Favorite[]) => {
        // Extract article IDs from favorites and store them in the favoriteArticleIds array
        this.favoriteArticleIds = favorites
          .filter(fav => fav.articles && fav.articles.length > 0 && fav.articles[0].id !== undefined)
          .map(fav => fav.articles![0].id!);
        console.log('Loaded favorite article IDs:', this.favoriteArticleIds);
      },
      error: (error) => {
        console.error('Error loading user favorites:', error);
      }
    });
  }

  // Replace the previous Read Later methods with the new implementations
  loadReadLater(): void {
    // Force refresh from server with cache-busting
    const timestamp = new Date().getTime();

    // Add a small delay before loading to ensure DB transaction completes
    setTimeout(() => {
      this.readLaterService.getReadLaterByUser(this.userId).subscribe({
        next: (readLaterItems) => {
          this.readLaterItems = readLaterItems;
          console.log('Read Later items loaded (timestamp: ' + timestamp + '):', readLaterItems);

          // Force component update
          this.filteredArticles = [...this.filteredArticles];
        },
        error: (error) => {
          console.error('Error loading read later items:', error);
        }
      });
    }, 300); // Small delay to ensure database commit
  }

  openReadLaterModal(article: Article): void {
    this.selectedArticleForReadLater = article;
    this.showReadLaterModal = true;

    // Set default reminder time to current time + 1 day
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    this.reminderDate = tomorrow.toISOString().slice(0, 16);
  }

  closeReadLaterModal(): void {
    this.showReadLaterModal = false;
    this.selectedArticleForReadLater = null;
  }

   addToReadLater(): void {

        if (!this.selectedArticleForReadLater || !this.selectedArticleForReadLater.id || this.userId === null) {
   
          console.error('Missing data for adding to read later');
   
          return;
   
        }
   
   
   
        const articleId = this.selectedArticleForReadLater.id;
   
         
   
        // Check if this article is already marked for read later
   
        const existingItem = this.readLaterItems.find(item =>
   
          item.article && item.article.id === articleId);
   
   
   
        if (existingItem) {
   
          // If it already exists, ask the user if they want to update the reminder date
   
          if (confirm('This article is already in your "Read Later" list. Do you want to update the reminder date?')) {
   
            // Use the existing ID to update the reminder date
   
            const reminderDateTime = new Date(this.reminderDate).toISOString();
   
   
   
            console.log(`Updating existing read later item (ID: ${existingItem.id}) with new reminder date: ${reminderDateTime}`);
   
   
   
            this.readLaterService.addReadLater(this.userId, articleId, reminderDateTime).subscribe({
   
              next: (response) => {
   
                console.log('Read later reminder updated:', response);
   
   
   
                // Close modal first to avoid UI freezing
   
                this.closeReadLaterModal();
   
   
   
                // Force reload data from server with a longer delay
   
                setTimeout(() => {
   
                  this.loadReadLater();
   
                }, 500);
   
              },
   
              error: (error) => {
   
                console.error('Error updating read later reminder:', error);
   
                alert('Failed to update the reminder. Please try again.');
   
              }
   
            });
   
          } else {
   
            this.closeReadLaterModal();
   
          }
   
        } else {
   
          // New entry
   
          const reminderDateTime = new Date(this.reminderDate).toISOString();
   
   
   
          console.log('Adding new article to read later:', {
   
            userId: this.userId,
   
            articleId: articleId,
   
            reminderDate: reminderDateTime
   
          });
   
   
   
          this.readLaterService.addReadLater(this.userId, articleId, reminderDateTime).subscribe({
   
            next: (response) => {
   
              console.log('Article added to read later:', response);
   
   
   
              // Close modal first to avoid UI freezing
   
              this.closeReadLaterModal();
   
   
   
              // Force reload data from server with a longer delay
   
              setTimeout(() => {
   
                this.loadReadLater();
   
              }, 500);
   
            },
   
            error: (error) => {
   
              console.error('Error adding to read later:', error);
   
              alert('Failed to add article to read later. Please try again.');
   
            }
   
          });
   
        }
   
      }
  removeFromReadLater(readLaterId: number | undefined): void {
    if (readLaterId !== undefined) {
      this.readLaterService.removeReadLater(readLaterId).subscribe({
        next: () => {
          console.log('Article removed from read later');
          this.loadReadLater();
        },
        error: (error) => {
          console.error('Error removing from read later:', error);
        }
      });
    }
  }

  isReadLater(articleId: number): boolean {
    return this.isInReadLater(articleId);
  }

  isInReadLater(articleId: number): boolean {
    return this.readLaterItems.some(item => item.article && item.article.id === articleId);
  }

  getReadLaterId(articleId: number): number | undefined {
    const readLaterItem = this.readLaterItems.find(item => item.article && item.article.id === articleId);
    return readLaterItem?.id;
  }

  toggleNotificationsPanel(): void {
    this.showNotifications = !this.showNotifications;
  }

  markNotificationAsRead(notificationId: number): void {
    this.readLaterService.markNotificationAsRead(notificationId).subscribe({
      next: () => {
        console.log('Notification marked as read:', notificationId);
        this.notifications = this.notifications.filter(n => n.id !== notificationId);
      },
      error: (error) => {
        console.error('Error marking notification as read:', error);
      }
    });
  }

  // Add a new method to check notifications immediately
  checkNotifications(): void {
    if (this.userId) {
      console.log('Initial notification check...');
      this.readLaterService.checkPendingNotifications(this.userId).subscribe({
        next: (notifications) => {
          this.handleNotificationsResponse(notifications);
        },
        error: (error) => {
          console.error('Error in initial notification check:', error);
        }
      });
    }
  }

  // Separate method to handle notification response
  handleNotificationsResponse(notifications: ReadLater[]): void {
    console.log('Received notifications:', notifications);

    if (notifications.length > 0) {
      // Update the notifications array with the latest notifications
      this.notifications = notifications;

      // Since emails are sent by the backend, we just need to update the UI here
      // No need for additional client-side notification if emails are already sent
    }
  }

  // Method to display an alert for new notifications
  showNotificationAlert(newNotifications: ReadLater[]): void {
    // Only show browser notifications as emails are already sent by the backend
    if (newNotifications.length > 0) {
      const notification = newNotifications[0];
      const articleTitle = notification.article?.title || 'an article';

      // Show browser notification if supported
      if ('Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification('Reading Reminder', {
            body: `Time to read: ${articleTitle} (Email sent to your registered address)`,
            icon: '/assets/images/notification-icon.png'
          });
        } else if (Notification.permission !== 'denied') {
          Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
              new Notification('Reading Reminder', {
                body: `Time to read: ${articleTitle} (Email sent to your registered address)`,
                icon: '/assets/images/notification-icon.png'
              });
            }
          });
        }
      }
    }
  }

  toggleReadLater(article: Article): void {
    if (!article.id) {
      console.error('Article ID is undefined');
      return;
    }
   
    if (this.isInReadLater(article.id)) {
      const readLaterId = this.getReadLaterId(article.id);
      this.removeFromReadLater(readLaterId);
    } else {
      this.openReadLaterModal(article);
    }
  }

  // Make sure we have the reactionCounts property properly defined
  reactionCounts: { [articleId: number]: { [key: string]: number } } = {}; // Track reactions per article

  // Add methods for article analysis
  openAnalysisModal(article: Article): void {
    this.selectedArticleForAnalysis = article;
    this.showAnalysisModal = true;
    this.analysisResult = null;
    this.analysisLoading = true;
   
    if (article.id) {
      this.chatbotService.analyzeArticle(article.id).subscribe({
        next: (result) => {
          this.analysisResult = result;
          this.analysisLoading = false;
        },
        error: (error) => {
          console.error('Error analyzing article:', error);
          this.analysisLoading = false;
          this.analysisResult = { error: 'Failed to analyze article. Please try again.' };
        }
      });
    }
  }

  closeAnalysisModal(): void {
    this.showAnalysisModal = false;
    this.selectedArticleForAnalysis = null;
    this.analysisResult = null;
  }

  // Chatbot methods
  toggleChatbot(): void {
    this.showChatbot = !this.showChatbot;
    if (this.showChatbot) {
      // Initialize if first time opening
      if (this.botMessages.length === 0) {
        this.botMessages.push({
          content: 'Hello! I am your BrainWave assistant. How can I help you with articles today?',
          isUser: false,
          timestamp: new Date()
        });
      }
      setTimeout(() => {
        this.scrollChatToBottom();
      }, 100);
    }
  }
 
  sendChatbotMessage(): void {
    if (!this.chatbotInput.trim()) return;
   
    // Add user message
    const userMessage = this.chatbotInput.trim();
    this.botMessages.push({
      content: userMessage,
      isUser: true,
      timestamp: new Date()
    });
   
    // Clear input and scroll to bottom
    this.chatbotInput = '';
    this.scrollChatToBottom();
   
    // Show typing indicator
    this.isChatbotTyping = true;
   
    // Send message to service
    this.chatbotService.sendMessage(userMessage, this.userId).subscribe({
      next: (response) => {
        // Small delay to simulate typing
        setTimeout(() => {
          this.isChatbotTyping = false;
          this.botMessages.push({
            content: response.message,
            isUser: false,
            timestamp: new Date(),
            data: response
          });
          this.scrollChatToBottom();
        }, 1000);
      },
      error: (error) => {
        console.error('Error sending message to chatbot:', error);
        setTimeout(() => {
          this.isChatbotTyping = false;
          this.botMessages.push({
            content: 'Sorry, I encountered an error. Please try again later.',
            isUser: false,
            timestamp: new Date()
          });
          this.scrollChatToBottom();
        }, 1000);
      }
    });
  }
 
  private scrollChatToBottom(): void {
    try {
      setTimeout(() => {
        if (this.chatMessagesContainer) {
          const element = this.chatMessagesContainer.nativeElement;
          element.scrollTop = element.scrollHeight;
        }
      }, 100);
    } catch (err) {
      console.error('Error scrolling to bottom:', err);
    }
  }

  // Add these methods
  checkScrollPosition() {
    this.showBackToTop = window.scrollY > 500;
  }

  scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  // Add a method to handle image URLs
  getImageUrl(imagePath: string | undefined): string {
    if (!imagePath) {
      return 'assets/images/default-article.jpg';
    }
   
    // Check if the image path is already a full URL
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
   
    // Check if the path includes the UUID format from the backend (has underscore)
    if (imagePath.includes('_')) {
      // This is likely a file uploaded through multipart/form-data
      return `http://localhost:8085/uploads/${imagePath}`;
    }
   
    // Fallback to assuming it's a relative path in assets
    return `assets/images/${imagePath}`;
  }
 
  // Method to check if article has additional media
  hasAdditionalMedia(article: Article): boolean {
    return this.hasVideo(article) || this.hasPdf(article);
  }
 
  // Method to check if article has video
  hasVideo(article: Article): boolean {
    return article.ressources?.some(res => res.video) || false;
  }
 
  // Method to check if article has PDF
  hasPdf(article: Article): boolean {
    return article.ressources?.some(res => res.pdf) || false;
  }

  // Updated method to periodically check for new notifications instead of using WebSockets
  private setupNotificationPolling(): void {
    if (this.userId) {
      console.log('Setting up notification polling for user:', this.userId);
     
      // Start a timer to check for notifications every 30 seconds
      this.notificationSubscription = interval(30000)
        .pipe(
          switchMap(() => this.readLaterService.checkPendingNotifications(this.userId))
        )
        .subscribe({
          next: (notifications: ReadLater[]) => { // Added type annotation
            // Check if we have new notifications
            const newNotifications = notifications.filter((n: ReadLater) => // Added type annotation
              !this.notifications.some(existing => existing.id === n.id)
            );
           
            if (newNotifications.length > 0) {
              console.log('New notifications received:', newNotifications);
             
              // Show notifications in UI
              this.handleNotificationsResponse(notifications);
             
              // Display alert for new notifications
              this.showNotificationAlert(newNotifications);
            }
          },
          error: (error: any) => { // Added type annotation
            console.error('Notification polling error:', error);
          }
        });
    }
  }
}