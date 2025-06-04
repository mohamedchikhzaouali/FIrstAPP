import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http'; // HttpHeaders importé
import { Observable } from 'rxjs';
import { Review } from 'src/app/Model/CourseModel/Review'; // Assurez-vous que le chemin et le modèle sont corrects

@Injectable({
  providedIn: 'root'
})
export class ReviewService {
  private baseUrl = 'http://localhost:8087/reviews'; // URL de base pour les reviews

  constructor(private http: HttpClient) {}

  // Helper pour créer les en-têtes d'autorisation
  // Cette méthode devrait idéalement être dans un service partagé ou gérée par un intercepteur HTTP.
  private createAuthHeaders(): HttpHeaders {
    let token = localStorage.getItem('jwt'); // Ou la manière dont vous stockez votre token JWT
    if (token?.startsWith('Bearer ')) {
        token = token.replace('Bearer ', ''); // Nettoyer le token si 'Bearer ' est déjà là
    }
    // S'assurer que le token est bien formaté AVANT de l'envoyer
    return new HttpHeaders({
        'Authorization': `Bearer ${token}` // Le backend s'attend à "Bearer <token>"
    });
  }

  /**
   * Ajoute un nouvel avis à un cours.
   * L'auteur est déterminé par le backend à partir du token JWT.
   * @param courseId L'ID du cours auquel l'avis est associé.
   * @param rating La note donnée par l'étudiant.
   * @param comment Le commentaire de l'étudiant.
   * @returns Un Observable de l'objet Review sauvegardé.
   */
  addReview(courseId: number, rating: number, comment: string): Observable<Review> {
    // L'objet envoyé ne contient que rating et comment.
    // Le backend associera l'auteur (Person) et le cours (Course).
    const reviewData: Partial<Review> = { rating, comment };
    
    // L'endpoint /add/{courseId} est utilisé.
    // Les HttpHeaders avec le token JWT sont nécessaires pour que le backend identifie l'auteur.
    return this.http.post<Review>(`${this.baseUrl}/add/${courseId}`, reviewData, { headers: this.createAuthHeaders() });
  }

  /**
   * Récupère tous les avis pour un cours spécifique.
   * Les informations de l'auteur devraient être incluses par le backend.
   * @param courseId L'ID du cours.
   * @returns Un Observable d'un tableau de Reviews.
   */
  getReviewsByCourse(courseId: number): Observable<Review[]> {
    // Cet endpoint est généralement public ou du moins accessible aux utilisateurs connectés.
    // Si l'accès aux avis est public et ne nécessite pas de token, les headers peuvent être omis.
    // Cependant, si le backend requiert un token même pour lire, ajoutez { headers: this.createAuthHeaders() }.
    return this.http.get<Review[]>(`${this.baseUrl}/course/${courseId}`);
  }

  /**
   * Supprime un avis.
   * Devrait être sécurisé côté backend pour autoriser uniquement l'auteur ou un admin.
   * @param reviewId L'ID de l'avis à supprimer.
   * @returns Un Observable avec un message de confirmation (texte).
   */
  deleteReview(reviewId: number): Observable<string> {
    // La suppression nécessite une authentification et une autorisation.
    return this.http.delete(`${this.baseUrl}/delete/${reviewId}`, { 
      headers: this.createAuthHeaders(), 
      responseType: 'text' 
    });
  }

  /**
   * Récupère un avis spécifique par son ID.
   * @param reviewId L'ID de l'avis.
   * @returns Un Observable de l'objet Review.
   */
  getReviewById(reviewId: number): Observable<Review> {
    // Généralement public ou accessible aux utilisateurs connectés.
    return this.http.get<Review>(`${this.baseUrl}/get/${reviewId}`);
  }

  /**
   * Met à jour un avis existant.
   * Devrait être sécurisé côté backend (auteur ou admin).
   * @param reviewId L'ID de l'avis à mettre à jour.
   * @param updatedReviewData Les nouvelles données de l'avis (rating, comment).
   * @returns Un Observable de l'objet Review mis à jour.
   */
  updateReview(reviewId: number, updatedReviewData: Partial<Review>): Observable<Review> {
    // La mise à jour nécessite une authentification et une autorisation.
    // On envoie seulement les champs modifiables.
    const payload: Partial<Review> = {
        rating: updatedReviewData.rating,
        comment: updatedReviewData.comment
    };
    return this.http.put<Review>(`${this.baseUrl}/update/${reviewId}`, payload, { headers: this.createAuthHeaders() });
  }

  /**
   * Récupère la note moyenne pour un cours spécifique.
   * @param idCourse L'ID du cours.
   * @returns Un Observable du nombre représentant la note moyenne.
   */
  getAverageRating(idCourse: number): Observable<number> {
    // Généralement public.
    return this.http.get<number>(`${this.baseUrl}/${idCourse}/averageRating`);
  }

  /**
   * Récupère tous les avis de tous les cours.
   * Peut nécessiter une pagination ou des filtres supplémentaires sur de gros volumes de données.
   * @returns Un Observable d'un tableau de toutes les Reviews.
   */
  getAllReviews(): Observable<Review[]> {
    // Accès généralement restreint (admin) ou paginé.
    // Si c'est pour un admin et nécessite un token : { headers: this.createAuthHeaders() }
    return this.http.get<Review[]>(`${this.baseUrl}`);
  }

  /**
   * Récupère les statistiques de sentiment agrégées pour tous les avis.
   * @returns Un Observable d'une Map où la clé est le sentiment (string) 
   * et la valeur est le nombre d'avis (number).
   */
  getSentimentStatistics(): Observable<Map<string, number>> { 
    // Généralement pour admin ou affichage de statistiques.
    // Si nécessite un token : { headers: this.createAuthHeaders() }
    return this.http.get<Map<string, number>>(`${this.baseUrl}/statistics/sentiment`);
  }
}