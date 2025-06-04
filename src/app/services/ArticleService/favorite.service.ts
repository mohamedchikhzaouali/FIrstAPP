import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Favorite } from 'src/app/Model/favorite';

@Injectable({
  providedIn: 'root'
})
export class FavoriteService {
  private apiUrl = 'http://localhost:8087/favorites';

  constructor(private http: HttpClient) {}

  // Add an article to the user's favorites
  addFavorite(userId: number, articleId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/add?userId=${userId}&articleId=${articleId}`, {});
  }

  // Remove a favorite based on the Favorite ID
  removeFavorite(favoriteId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/remove/${favoriteId}`);
  }

  // Get all favorite items for a specific user (returns Favorite[])
  getFavoriteArticles(userId: number): Observable<Favorite[]> {
    return this.http.get<Favorite[]>(`${this.apiUrl}/user/${userId}/favorites`);
  }
  

 
}