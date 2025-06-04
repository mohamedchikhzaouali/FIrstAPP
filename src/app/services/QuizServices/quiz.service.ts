import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Quiz } from 'src/app/Model/QuizModel/quiz';
import { Question } from 'src/app/Model/QuizModel/question';
import { Response } from 'src/app/Model/QuizModel/response';

@Injectable({
  providedIn: 'root',
})
export class QuizService {
  private apiUrl = 'http://localhost:8087/quiz';

  constructor(private http: HttpClient) {}

  getAllQuizzesByCourseId(courseId: number): Observable<Quiz[]> {
  return this.http.get<Quiz[]>(`${this.apiUrl}/all/${courseId}`);
  }

  addQuiz(quiz: Quiz, courseId: number): Observable<Quiz> {
    return this.http.post<Quiz>(`${this.apiUrl}/add/quiz/${courseId}`, quiz);
  }

  getQuizById(id: number): Observable<Quiz> {
    return this.http.get<Quiz>(`${this.apiUrl}/${id}`);
  }

  updateQuiz(id: number, quiz: Quiz): Observable<Quiz> {
    return this.http.put<Quiz>(`${this.apiUrl}/update/${id}`, quiz);
  }

  deleteQuiz(id: number): Observable<string> {
    return this.http.delete(`${this.apiUrl}/delete/${id}`, { responseType: 'text' });
  }  

  deleteQuestion(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/questions/delete/${id}`);
  }

  addResponse(questionId: number, response: Response): Observable<Response> {
    return this.http.post<Response>(`${this.apiUrl}/responses/add/${questionId}`, response);
  }

  deleteResponse(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/responses/delete/${id}`);
  }
}