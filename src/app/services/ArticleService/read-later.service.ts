import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, Subscription, interval } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { ReadLater } from 'src/app/Model/read-later';

@Injectable({
  providedIn: 'root'
})
export class ReadLaterService {
  private apiUrl = 'http://localhost:8087/readlater';
  private pollingSubscription: Subscription | null = null;

  constructor(private http: HttpClient) {}

  addReadLater(userId: number, articleId: number, reminderDate: string): Observable<ReadLater> {
    // Add cache-busting parameters
    const timestamp = new Date().getTime();
    const uniqueId = Math.floor(Math.random() * 1000000);
    
    let params = new HttpParams()
      .set('userId', userId.toString())
      .set('articleId', articleId.toString())
      .set('reminderDate', reminderDate)
      .set('_t', timestamp.toString())
      .set('unique', uniqueId.toString());
    
    return this.http.post<ReadLater>(`${this.apiUrl}/add`, null, { params });
  }

  getReadLaterByUser(userId: number): Observable<ReadLater[]> {
    const timestamp = new Date().getTime();
    return this.http.get<ReadLater[]>(`${this.apiUrl}/user/${userId}?_t=${timestamp}`);
  }

  getReadLaterArticlesByUser(userId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/user/${userId}/articles`);
  }
  
  removeReadLater(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/remove/${id}`);
  }
  
  removeReadLaterByUserAndArticle(userId: number, articleId: number): Observable<void> {
    let params = new HttpParams()
      .set('userId', userId.toString())
      .set('articleId', articleId.toString());
    
    return this.http.delete<void>(`${this.apiUrl}/remove`, { params });
  }

  checkPendingNotifications(userId: number): Observable<ReadLater[]> {
    const timestamp = new Date().getTime();
    return this.http.get<ReadLater[]>(`${this.apiUrl}/user/${userId}/pending?_t=${timestamp}`);
  }
  
  markNotificationAsRead(notificationId: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/notification/${notificationId}/read`, null);
  }

  startNotificationPolling(userId: number): Observable<ReadLater[]> {
    // Stop any existing polling
    this.stopNotificationPolling();
    
    // Create a new polling observable that checks for notifications every 30 seconds
    return interval(30000).pipe(
      switchMap(() => this.checkPendingNotifications(userId))
    );
  }

  stopNotificationPolling(): void {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
      this.pollingSubscription = null;
    }
  }
}
