import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ReclamationService {

  private baseUrl = "http://localhost:8087/recalamtions";

  constructor(private http: HttpClient) { }

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

  getReclamationUser(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/list`, { headers: this.createAuthHeaders() });
  }

  getReclamation(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/all/list`, { headers: this.createAuthHeaders() });
  }

  ajouterreclamation(reclamation: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/add`, reclamation, { headers: this.createAuthHeaders() });
  }

  supprimerReclamation(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/delete/${id}`, { headers: this.createAuthHeaders() });
  }

  modifierReclamation(reclamation: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/update/${reclamation.id}`, reclamation, { headers: this.createAuthHeaders() });
  }

  reclamationStats(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/stats`, { headers: this.createAuthHeaders() });
  }

  getReclamationById(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${id}`, { headers: this.createAuthHeaders() });
  }
}