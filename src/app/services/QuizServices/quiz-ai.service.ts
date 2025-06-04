import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http'; // Import HttpParams
import { Observable } from 'rxjs';
import { Quiz } from 'src/app/Model/QuizModel/quiz'; 

interface QuizGenerationData {
    quizTitle: string;
    theme: string;
    multipleChoiceCount: number;
    dragAndDropCount: number;
}

@Injectable({
    providedIn: 'root',
})
export class QuizAIService {
    private apiUrl = 'http://localhost:8087/quiz/ai';

    constructor(private http: HttpClient) {}

    generateQuizFromJson(data: QuizGenerationData, courseId: number): Observable<Quiz> { // Add courseId parameter
        const params = new HttpParams().set('courseId', courseId.toString()); // Create HttpParams
        return this.http.post<Quiz>(`${this.apiUrl}/generate-from-json/${courseId}`, data); //Pass courseId in the URL
    }
}
