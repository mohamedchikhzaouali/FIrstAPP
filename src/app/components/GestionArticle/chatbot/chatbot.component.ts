import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ChatbotService, ChatbotResponse } from '../../../services/ArticleService/chatbot.service';
;
import { interval } from 'rxjs';
import { Article } from 'src/app/Model/article';

interface ChatMessage {
  content: string;
  isUser: boolean;
  timestamp: Date;
  data?: any; // For additional data like article recommendations
}

interface ApiLimitInfo {
  dailyLimit: number;
  remainingCalls: number;
  isLimited: boolean;
}

@Component({
  selector: 'app-chatbot',
  templateUrl: './chatbot.component.html',
  styleUrls: ['./chatbot.component.scss']
})
export class ChatbotComponent implements OnInit {
  messages: ChatMessage[] = [];
  newMessage: string = '';
  isLoading: boolean = false;
  chatVisible: boolean = false;
  userId: number = 1; // Replace with actual user ID from authentication
  context: string = 'general';
  
  // API limit info
  apiLimitInfo: ApiLimitInfo | null = null;
  isLimitWarningShown = false;
  
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;

  constructor(private chatbotService: ChatbotService) { }

  ngOnInit(): void {
    // Add a welcome message
    this.messages.push({
      content: 'Bonjour! Je suis votre assistant BrainWave. Comment puis-je vous aider aujourd\'hui?',
      isUser: false,
      timestamp: new Date()
    });
    
    // Check API limit on initialization
    this.checkApiLimit();
    
    // Set up periodic check for API limits (every 5 minutes)
    interval(300000).subscribe(() => {
      this.checkApiLimit();
    });
  }

  toggleChat(): void {
    this.chatVisible = !this.chatVisible;
    if (this.chatVisible) {
      // When chat is opened, check the API limit
      this.checkApiLimit();
      
      // Scroll to bottom of messages
      setTimeout(() => this.scrollToBottom(), 100);
    }
  }

  sendMessage(): void {
    if (!this.newMessage.trim()) return;
    
    // Check API limit before sending message
    if (this.apiLimitInfo?.isLimited) {
      this.messages.push({
        content: `Désolé, nous avons atteint la limite quotidienne d'utilisation de l'API (${this.apiLimitInfo.dailyLimit} messages). Veuillez réessayer demain.`,
        isUser: false,
        timestamp: new Date()
      });
      this.newMessage = '';
      this.scrollToBottom();
      return;
    }
    
    // Show warning if getting close to limit
    if (this.apiLimitInfo && this.apiLimitInfo.remainingCalls < 10 && !this.isLimitWarningShown) {
      this.messages.push({
        content: `Attention: Il ne reste que ${this.apiLimitInfo.remainingCalls} appels API aujourd'hui. Certaines fonctionnalités pourraient être limitées.`,
        isUser: false,
        timestamp: new Date()
      });
      this.isLimitWarningShown = true;
      this.scrollToBottom();
    }

    // Add user message to chat
    this.messages.push({
      content: this.newMessage,
      isUser: true,
      timestamp: new Date()
    });

    // Store message text and clear input
    const messageText = this.newMessage;
    this.newMessage = '';
    this.isLoading = true;
    this.scrollToBottom();

    // Send to service
    this.chatbotService.sendMessage(messageText, this.userId, this.context)
      .subscribe({
        next: (response: ChatbotResponse) => {
          this.handleBotResponse(response);
          this.isLoading = false;
          // Refresh API limit after each message
          this.checkApiLimit();
        },
        error: (error) => {
          console.error('Error sending message to chatbot:', error);
          this.messages.push({
            content: 'Désolé, je rencontre des difficultés pour répondre. Veuillez réessayer plus tard.',
            isUser: false,
            timestamp: new Date()
          });
          this.isLoading = false;
          this.scrollToBottom();
        }
      });
  }

  private handleBotResponse(response: ChatbotResponse): void {
    // Add the bot's text response
    this.messages.push({
      content: response.message,
      isUser: false,
      timestamp: new Date(),
      data: response
    });

    // Update context based on conversation
    if (response.type) {
      this.context = response.type;
    }
    
    this.scrollToBottom();
  }

  // Helper method to navigate to an article
  viewArticle(article: Article): void {
    // You can implement navigation to the article detail page
    window.location.href = `/articles/detail/${article.id}`;
  }
  
  // Method to check API limit
  checkApiLimit(): void {
    this.chatbotService.getChatbotLimit().subscribe({
      next: (limitInfo) => {
        this.apiLimitInfo = limitInfo;
        console.log('API Limit Info:', limitInfo);
        
        // If API is completely limited, show a message
        if (limitInfo.isLimited && this.chatVisible && this.messages.length === 1) {
          this.messages.push({
            content: `Nous avons atteint la limite quotidienne d'utilisation de l'API (${limitInfo.dailyLimit} messages). Le service utilise actuellement des réponses de secours simples. Certaines fonctionnalités avancées ne sont pas disponibles.`,
            isUser: false,
            timestamp: new Date()
          });
        }
      },
      error: (error) => {
        console.error('Error checking API limit:', error);
      }
    });
  }
  
  // Method to scroll to bottom of chat
  private scrollToBottom(): void {
    try {
      setTimeout(() => {
        if (this.messagesContainer) {
          const element = this.messagesContainer.nativeElement;
          element.scrollTop = element.scrollHeight;
        }
      }, 100);
    } catch (err) {
      console.error('Error scrolling to bottom of chat:', err);
    }
  }
  
  // Returns a user-friendly display of the API limit status
  getLimitStatusDisplay(): string {
    if (!this.apiLimitInfo) return '';
    
    return `${this.apiLimitInfo.remainingCalls} / ${this.apiLimitInfo.dailyLimit} messages restants`;
  }
}
