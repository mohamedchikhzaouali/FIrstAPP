import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Response } from 'src/app/Model/QuizModel/response';
import { DragAndDropPair } from 'src/app/Model/QuizModel/dragAndDropPair';

@Injectable({
  providedIn: 'root',
})
export class ResponseService {
  private apiUrl = 'http://localhost:8087/quiz';

  constructor(private http: HttpClient) {}

  // Response (MULTIPLE_CHOICE) ***************************************************************************************************

  getListResponsesByQuestionId(questionId: number): Observable<Response[]> {
    return this.http.get<Response[]>(`${this.apiUrl}/listResponses/${questionId}`);
  }

  addResponse(response: Response, questionId: number): Observable<Response> {
    return this.http.post<Response>(`${this.apiUrl}/responses/add/${questionId}`, response);
  }
  
  // Récupérer une réponse par son ID
  getResponseById(id: number): Observable<Response> {
    return this.http.get<Response>(`${this.apiUrl}/response/${id}`);
  }

  updateResponse(id: number, response: Response): Observable<Response> {
    return this.http.put<Response>(`${this.apiUrl}/response/update/${id}`, response);
  }

  deleteResponse(id: number): Observable<string> {
    return this.http.delete(`${this.apiUrl}/responses/delete/${id}`, { responseType: 'text' });
  }

  
  // Response (DRAG_AND_DROP) ***************************************************************************************************
  getDragAndDropPairById(id: number): Observable<DragAndDropPair> {
    return this.http.get<DragAndDropPair>(`${this.apiUrl}/drag-drop/${id}`);
  }
  getListDragAndDropByQuestionId(questionId: number): Observable<DragAndDropPair[]> {
    return this.http.get<DragAndDropPair[]>(`${this.apiUrl}/list-drag-drop/${questionId}`);
  }
  
  addDragAndDropPair(DragAndDropPair: DragAndDropPair, questionId: number): Observable<DragAndDropPair> {
    return this.http.post<DragAndDropPair>(`${this.apiUrl}/drag-drop/add/${questionId}`, DragAndDropPair);
  }  

  updateDragAndDropPair(id: number, dragAndDropPair: DragAndDropPair): Observable<DragAndDropPair> {
    return this.http.put<DragAndDropPair>(`${this.apiUrl}/update-dragdrop/${id}`, dragAndDropPair);
  }  

  deleteDragAndDropPair(id: number): Observable<string> {
    return this.http.delete(`${this.apiUrl}/delete-dragdrop/${id}`, { responseType: 'text' });
  }
  
}
