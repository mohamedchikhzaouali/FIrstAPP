import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';
import { StudentQuiz } from 'src/app/Model/QuizModel/StudentQuiz';

@Injectable({
  providedIn: 'root'
})
export class StudentQuizService {

  private apiUrl = 'http://localhost:8087/quiz';

  constructor(private http: HttpClient) {}

  // Helper function to create the Authorization header
  private createAuthHeaders(): HttpHeaders {
    let token = localStorage.getItem('jwt');
    if (token?.startsWith('Bearer ')) {
      token = token.replace('Bearer ', '');
    }
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  evaluateQuiz(quizId: number, studentAnswers: { questionId: number, response: any, responseType: string }[]): Observable<number> {
    return this.http.post<number>(`${this.apiUrl}/evaluate/${quizId}`, studentAnswers, { headers: this.createAuthHeaders() });
  }

  getQuizStatistics(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/statistics`);
  }

  /*getStudentByCin(cin: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/student/${cin}`);
  }*/

  createCheckoutSession(amount: number, currency: string, quizId: number): Observable<string> {
    const params = new HttpParams()
      .set('amount', amount.toString())
      .set('currency', currency)
      .set('quizId', quizId.toString());

    return this.http.post(this.apiUrl + '/create-checkout-session', null, { params: params, responseType: 'text', headers: this.createAuthHeaders() }); // Add headers here
  }

  updatePaymentStatus(quizId: number): Observable<string> {
    const params = new HttpParams()
      .set('quizId', quizId.toString());

    return this.http.put(this.apiUrl + '/update-payment-status', null, { params: params, responseType: 'text', headers: this.createAuthHeaders() });
  }

  updateEmailStatus(quizId: number): Observable<string> {
    const params = new HttpParams()
      .set('quizId', quizId.toString());

    return this.http.put(this.apiUrl + '/update-email-status', null, { params: params, responseType: 'text', headers: this.createAuthHeaders() }); // Corrected syntax
  }

  sendEmail(to: string, subject: string, htmlContent: string): Observable<any> {
    return this.http.post(this.apiUrl + '/send-email', { to, subject, htmlContent }).pipe();
  }

  getStudentQuizByStudentAndQuiz(quizId: number): Observable<StudentQuiz> {
    return this.http.get<StudentQuiz>(`${this.apiUrl}/StudentQuiz/${quizId}`, { headers: this.createAuthHeaders() });
  }

  getSuccessfulQuizzes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/successful-quizzes`, { headers: this.createAuthHeaders() });
  }

  // Save quiz progress **************************************************************************************
  saveQuizProgress(quizId: number, studentResponses: any, remainingTime: number): Observable<string> {
    const body = { studentResponses, remainingTime };
    return this.http.post<string>(`${this.apiUrl}/save-progress/${quizId}`, body, { headers: this.createAuthHeaders(), responseType: 'text' as 'json' });
  }

  // Get quiz progress
  getQuizProgress(quizId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/get-progress/${quizId}`, { headers: this.createAuthHeaders() });
  }
}