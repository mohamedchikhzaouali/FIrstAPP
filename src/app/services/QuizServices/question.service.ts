import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Question } from 'src/app/Model/QuizModel/question';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class QuestionService {
  private apiUrl = 'http://localhost:8087/quiz';  // URL de l'API

  constructor(private http: HttpClient) {}

  // Méthode pour récupérer les questions pour un quiz spécifique
  getListQuestionsByQuizId(quizId: number): Observable<Question[]> {
    return this.http.get<Question[]>(`${this.apiUrl}/listQuestions/${quizId}`);
  }  

  getQuestionById(id: number): Observable<Question> {
    return this.http.get<Question>(`${this.apiUrl}/question/${id}`);
  }
  
  updateQuestion(questionId: number, formData: FormData) {
    return this.http.put(`${this.apiUrl}/update-question/${questionId}`, formData);
  }  

  addQuestion(quizId: number, questionData: FormData): Observable<Question> {
    return this.http.post<Question>(`${this.apiUrl}/${quizId}/add-question`,questionData);
  }

  deleteQuestion(id: number): Observable<string> {
    return this.http.delete(`${this.apiUrl}/questions/delete/${id}`, { responseType: 'text' });
  }
}