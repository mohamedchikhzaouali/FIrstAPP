import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, tap, throwError } from 'rxjs';
import { Article } from 'src/app/Model/article';
import { Tag } from 'src/app/Model/tag';

@Injectable({
  providedIn: 'root'
})
export class SimilarArticlesService {
  private apiUrl = 'http://localhost:8087/articles';

  constructor(private http: HttpClient) { }

  getSimilarArticles(articleId: number, limit: number = 5): Observable<Article[]> {
    const params = new HttpParams().set('limit', limit.toString());
    
    console.log(`Requesting similar articles for article ID: ${articleId} with limit: ${limit}`);
    
    return this.http.get<Article[]>(`${this.apiUrl}/${articleId}/similar`, { params }).pipe(
      tap(articles => {
        console.log(`Received ${articles.length} similar articles:`, articles);
      }),
      catchError(this.handleError)
    );
  }

  getAllTags(): Observable<Tag[]> {
    return this.http.get<Tag[]>(`${this.apiUrl}/tags`).pipe(
      tap(tags => {
        console.log('All available tags:', tags);
      }),
      catchError(this.handleError)
    );
  }

  createTag(tagName: string): Observable<Tag> {
    return this.http.post<Tag>(`${this.apiUrl}/tags`, { name: tagName }).pipe(
      tap(tag => {
        console.log('Created new tag:', tag);
      }),
      catchError(this.handleError)
    );
  }

  addTagsToArticle(articleId: number, tagNames: string[]): Observable<Article> {
    console.log(`Adding tags ${tagNames.join(', ')} to article ID: ${articleId}`);
    return this.http.post<Article>(`${this.apiUrl}/${articleId}/tags`, tagNames).pipe(
      tap(article => {
        console.log('Updated article with new tags:', article);
      }),
      catchError(this.handleError)
    );
  }

  removeTagFromArticle(articleId: number, tagId: number): Observable<Article> {
    console.log(`Removing tag ID: ${tagId} from article ID: ${articleId}`);
    return this.http.delete<Article>(`${this.apiUrl}/${articleId}/tags/${tagId}`).pipe(
      tap(article => {
        console.log('Updated article after tag removal:', article);
      }),
      catchError(this.handleError)
    );
  }

  private handleError(error: any) {
    console.error('SimilarArticlesService error:', error);
    return throwError(() => new Error(error.error?.message || error.message || 'Server error'));
  }
}
