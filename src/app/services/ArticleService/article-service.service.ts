import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, map, tap, catchError, throwError } from 'rxjs';
import { Article } from 'src/app/Model/article';
import { Tag } from 'src/app/Model/tag';

@Injectable({
  providedIn: 'root'
})
export class ArticleServiceService {
  private apiUrl = 'http://localhost:8087/articles';
  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    })
  };

  constructor(private http: HttpClient) { }

  getAllArticles(): Observable<Article[]> {
    return this.http.get<Article[]>(`${this.apiUrl}`).pipe(
      tap(articles => {
        console.log('All articles:', articles);
      }),
      catchError(this.handleError)
    );
  }

  getArticleById(id: number): Observable<Article> {
    console.log('Fetching article with id:', id);
    return this.http.get<Article>(`${this.apiUrl}/getArticleWithRessources/${id}`).pipe(
      tap(response => {
        console.log('Raw API response:', response);
        if (response && !response.ressources) {
          response.ressources = [];
        }
      }),
      catchError(this.handleError)
    );
  }

  createArticle(article: Article, pictureFile?: File, resources?: { files: { [key: string]: File }, data: any[] }): Observable<Article> {
    const url = `${this.apiUrl}/ajouter`;

    // Create form data
    const formData = new FormData();

    // Add basic article information
    formData.append('id', article.user?.id?.toString() || '1');
    formData.append('title', article.title);
    if (article.date) {
      formData.append('date', typeof article.date === 'string' ? article.date : article.date.toISOString().split('T')[0]);
    }
    formData.append('categorie', article.categorie);
    formData.append('status', article.status ? 'true' : 'false');
    if (article.publicationStatus) {
      formData.append('publicationStatus', article.publicationStatus);
    }
    if (article.views !== undefined) {
      formData.append('views', article.views.toString());
    }
    if (article.numberShares !== undefined) {
      formData.append('numberShares', article.numberShares.toString());
    }

    // Add picture file if provided
    if (pictureFile) {
      formData.append('picture', pictureFile);
    } else if (article.picture) {
      formData.append('picturePath', article.picture);
    }

    // Add resources if available
    if (resources && resources.data) {
      resources.data.forEach((resource, index) => {
        // Add resource data
        formData.append(`resources[${index}].description`, resource.description || '');

        // Add resource files if they exist
        if (resources.files[`resource_${index}_picture`]) {
          formData.append(`resources[${index}].picture`, resources.files[`resource_${index}_picture`]);
        } else if (resource.picture) {
          formData.append(`resources[${index}].picturePath`, resource.picture);
        }

        if (resources.files[`resource_${index}_video`]) {
          formData.append(`resources[${index}].video`, resources.files[`resource_${index}_video`]);
        } else if (resource.video) {
          formData.append(`resources[${index}].videoPath`, resource.video);
        }

        if (resources.files[`resource_${index}_pdf`]) {
          formData.append(`resources[${index}].pdf`, resources.files[`resource_${index}_pdf`]);
        } else if (resource.pdf) {
          formData.append(`resources[${index}].pdfPath`, resource.pdf);
        }
      });
    }

    console.log('Sending multipart form data:', formData);

    return this.http.post<Article>(url, formData).pipe(
      tap(response => console.log('Created article with resources:', response)),
      catchError(this.handleError)
    );
  }

  approveArticle(id: number): Observable<Article> {
    const url = `${this.apiUrl}/approve/${id}`;
    return this.http.put<Article>(url, {}, this.httpOptions).pipe(
      tap(response => console.log(`Article ${id} approved`, response)),
      catchError(this.handleError)
    );
  }

  updateArticle(id: number, article: Article, pictureFile?: File, videoFile?: File, pdfFile?: File, resources?: {files: {[key: string]: File}, data: any[]}): Observable<Article> {
    const url = `${this.apiUrl}/modifier/${id}`;
   
    // Create form data
    const formData = new FormData();
   
    // Add basic article information
    formData.append('id', article.user?.id?.toString() || '1');
    formData.append('title', article.title);
    if (article.date) {
      formData.append('date', typeof article.date === 'string' ? article.date : article.date.toISOString().split('T')[0]);
    }
    formData.append('categorie', article.categorie);
    formData.append('status', article.status ? 'true' : 'false');
    if (article.publicationStatus) {
      formData.append('publicationStatus', article.publicationStatus);
    }
   
    // Add files if provided
    if (pictureFile) {
      formData.append('picture', pictureFile);
    } else if (article.picture) {
      // If pictureFile is not provided but article.picture exists and is a URL, just keep it
      formData.append('picturePath', article.picture);
    }
   
    if (videoFile) {
      formData.append('video', videoFile);
    }
   
    if (pdfFile) {
      formData.append('pdf', pdfFile);
    }
   
    // Add resources if available
    if (article.ressources && article.ressources.length > 0) {
      // Add resource data as JSON string
      formData.append('resourcesData', JSON.stringify(article.ressources));
    }
   
    // Add resource files if available
    if (resources && resources.data) {
      resources.data.forEach((resource, index) => {
        // Add resource data
        formData.append(`resource[${index}].description`, resource.description || '');
       
        // Add resource files if they exist
        if (resources.files[`resource_${index}_picture`]) {
          formData.append(`resource[${index}].picture`, resources.files[`resource_${index}_picture`]);
        } else if (resource.picture) {
          formData.append(`resource[${index}].picturePath`, resource.picture);
        }
       
        if (resources.files[`resource_${index}_video`]) {
          formData.append(`resource[${index}].video`, resources.files[`resource_${index}_video`]);
        } else if (resource.video) {
          formData.append(`resource[${index}].videoPath`, resource.video);
        }
       
        if (resources.files[`resource_${index}_pdf`]) {
          formData.append(`resource[${index}].pdf`, resources.files[`resource_${index}_pdf`]);
        } else if (resource.pdf) {
          formData.append(`resource[${index}].pdfPath`, resource.pdf);
        }
      });
    }
   
    console.log('Sending multipart form data with files and resources for update');
   
    return this.http.put<Article>(url, formData).pipe(
      tap(response => console.log('Updated article with files and resources:', response)),
      catchError(this.handleError)
    );
  }

  deleteArticle(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/delete/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  incrementView(articleId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/increment-view/${articleId}`, {}, this.httpOptions).pipe(
      catchError(this.handleError)
    );
  }

  getTop5MostViewedArticles(): Observable<Article[]> {
    return this.http.get<Article[]>(`${this.apiUrl}/top-5-viewed`).pipe(
      catchError(this.handleError)
    );
  }

  getPublishedArticles(): Observable<Article[]> {
    return this.http.get<Article[]>(`${this.apiUrl}/published`).pipe(
      tap(articles => {
        console.log('Published articles:', articles);
      }),
      catchError(this.handleError)
    );
  }

  getAllArticlesForBackOffice(): Observable<Article[]> {
    return this.http.get<Article[]>(`${this.apiUrl}`).pipe(
      tap(articles => {
        console.log('All articles for back office:', articles);
      }),
      catchError(this.handleError)
    );
  }

  updateArticleStatus(
    id: number,
    newStatus: 'DRAFT' | 'PENDING_REVIEW' | 'PENDING_APPROVAL' | 'PUBLISHED' | 'ARCHIVED'
  ): Observable<Article>{
    const url = `${this.apiUrl}/status/${id}?newStatus=${newStatus}`;
    return this.http.put<Article>(url, {}, this.httpOptions).pipe(
      tap(response => console.log(`Article ${id} status updated to ${newStatus}`, response)),
      catchError(this.handleError)
    );
  }
  reactArticle(articleId: number, userId: number, reactionType: string): Observable<any> {
    const params = new HttpParams().set('userId', userId).set('reactionType', reactionType);
    return this.http.post(`${this.apiUrl}/react/${articleId}`, {}, { ...this.httpOptions, params })
      .pipe(
        catchError(this.handleError)
      );
  }

  unreactArticle(articleId: number, userId: number): Observable<any> {
    const params = new HttpParams().set('userId', userId);
    return this.http.delete(`${this.apiUrl}/unreact/${articleId}`, { ...this.httpOptions, params })
      .pipe(
        catchError(this.handleError)
      );
  }

  getArticleReactions(articleId: number): Observable<{[key: string]: number}> {
    return this.http.get<{[key: string]: number}>(`${this.apiUrl}/reactions/${articleId}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  getUserReaction(articleId: number, userId: number): Observable<string | null> {
    const params = new HttpParams().set('userId', userId);
    return this.http.get<string | null>(`${this.apiUrl}/user-reaction/${articleId}`, { params })
      .pipe(
        catchError(this.handleError)
      );
  }

  getAllTags(): Observable<Tag[]> {
    return this.http.get<Tag[]>(`${this.apiUrl}/tags`);
  }

  private handleError(error: any) {
    console.error('An error occurred', error);
    return throwError(() => new Error(error.error?.message || error.message || 'Server error'));
  }
}
