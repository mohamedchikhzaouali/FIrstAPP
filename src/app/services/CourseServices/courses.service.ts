import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable, throwError } from 'rxjs';
import { Course } from 'src/app/Model/CourseModel/Course';

@Injectable({
  providedIn: 'root'
})
export class CoursesService {


private baseUrl = 'http://localhost:8087/courses'; // Assure-toi que ton backend tourne sur ce port

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
getCoursesForCurrentTeacher(): Observable<Course[]> {
    const url = `${this.baseUrl}/courses/teacher`; // Endpoint: GET /courses/teacher
    return this.http.get<Course[]>(url, { headers: this.createAuthHeaders() });
  }

addCourse(courseData: FormData): Observable<Course> {
  return this.http.post<Course>(`${this.baseUrl}/add`, courseData, { headers: this.createAuthHeaders() });
}

// Récupérer tous les cours
getCourses(): Observable<Course[]> {
  return this.http.get<Course[]>(`${this.baseUrl}`, { headers: this.createAuthHeaders() });
}

getFileUrl(filename: string): string {
  return `http://localhost:8087/attachments/attachments/${filename}`;
}

getCourseStatistics(): Observable<any> {
  return this.http.get<any>(`${this.baseUrl}/statistics`);
}
// Récupérer un cours par ID
getCourseById(id: number): Observable<Course> {
  return this.http.get<Course>(`${this.baseUrl}/${id}`);
}

  //Méthode pour ajouter un cours avec une publication programmée s7i7a
 scheduleCoursePublication(courseDataAsFormData: FormData): Observable<any> { // Accepte FormData
    // La méthode createAuthHeaders() DOIT être appelée ici
    return this.http.post(`${this.baseUrl}/createWithScheduledPublish`, courseDataAsFormData, { headers: this.createAuthHeaders() })
      .pipe(
        catchError(error => {
          console.error('Erreur lors de la planification du cours (service):', error);
          return throwError(() => error);
        })
      );
  }


  getCoursesSoon(): Observable<Course[]> {
    return this.http.get<Course[]>(`${this.baseUrl}/soon`, { headers: this.createAuthHeaders() });
  }

updateCourse(courseId: number, updatedCourse: any, file?: File): Observable<any> {
  const formData = new FormData();
  
  // Vérification que la catégorie est définie
  if (!updatedCourse.category || updatedCourse.category.trim() === '') {
    return throwError(() => new Error('La catégorie doit être spécifiée.'));
  }

  formData.append('title', updatedCourse.title);
  formData.append('level', updatedCourse.level);
  formData.append('description', updatedCourse.description);
  formData.append('category', updatedCourse.category);
  formData.append('price', updatedCourse.price);
  formData.append('status', updatedCourse.status);
  
  if (updatedCourse.date) {
    formData.append('date', updatedCourse.date);
  }
  
  if (file) {
    formData.append('file', file);
  }

  return this.http.put(`${this.baseUrl}/update/${courseId}`, formData, { headers: this.createAuthHeaders() }).pipe(
    catchError(error => {
      console.error('Erreur lors de la mise à jour du cours:', error);
      return throwError(() => error);
    })
  );
}

addToFavorites(courseId: number): Observable<Course> {
  return this.http.post<Course>(`${this.baseUrl}/courses/${courseId}/favorite`, {});
}

// Méthode pour retirer un cours des favoris
removeFromFavorites(courseId: number): Observable<Course> {
  return this.http.post<Course>(`${this.baseUrl}/${courseId}/remove-favorite`, {});
}

getPublishedCourses(): Observable<Course[]> {
  return this.http.get<Course[]>(`${this.baseUrl}`).pipe(
    map(courses => courses.filter(course => course.published)) // Filtrer les cours publiés
  );
}




// Supprimer un cours
deleteCourse(id: number): Observable<void> {
  return this.http.delete<void>(`${this.baseUrl}/delete/${id}`);
}
deleteCoursen(id: number): Observable<string> { // Change return type to Observable<string>
  return this.http.delete(`${this.baseUrl}/delete/${id}`, { responseType: 'text' }); // Tell HttpClient to expect text
}

// Récupérer une image
getImage(fileName: string): string {
  return `${this.baseUrl}/images/${fileName}`;
}

getCourseRating(idCourse: number): Observable<number> {
  return this.http.get<number>(`http://localhost:8087/reviews/courses/${idCourse}/rating`);
}

getTotalCourses(): Observable<number> {
  return this.http.get<number>(`${this.baseUrl}/count`);
}


getFavoriteCourses(): Observable<number> {
  return this.http.get<number>(`${this.baseUrl}/favorites/count`);
}
// NOUVELLE méthode pour les statistiques par catégorie
getCategoryStatistics(): Observable<any> {
  // Utilise l'URL que vous avez fournie
  return this.http.get<any>(`${this.baseUrl}/statistics/category`);
}
updateCourseStatus(idCourse: number, newStatus: boolean): Observable<any> {
  const url = `${this.baseUrl}/${idCourse}/status`; // URL avec /status
  // Créer les paramètres de requête
  const params = new HttpParams().set('status', newStatus.toString());
  // Envoyer en PUT, sans corps (null), mais avec les paramètres
  return this.http.put(url, null, { params: params });
}

 // Nouvelle méthode pour récupérer les cours recommandés
 getRecommendedCourses(limit: number = 5): Observable<Course[]> {
  return this.http.get<Course[]>(`${this.baseUrl}/recommended`, {
    params: new HttpParams().set('limit', limit.toString())
  });
}

}