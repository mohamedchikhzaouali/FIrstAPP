import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http'; // HttpHeaders ajouté si nécessaire pour les appels ForUser
import { catchError, Observable, throwError } from 'rxjs';
import { Attachment } from 'src/app/Model/CourseModel/Attachment'; // Assurez-vous que le chemin est correct
// Si vous avez un DTO spécifique pour la progression utilisateur, importez-le aussi
// import { AttachmentUserProgressDTO } from 'src/app/Model/CourseModel/AttachmentUserProgressDTO';


@Injectable({
  providedIn: 'root'
})
export class AttachmentService {
  // URL de base correcte pour votre backend Spring Boot
  private baseUrl = 'http://localhost:8087/attachments';

  constructor(private http: HttpClient) {}

  // Helper pour créer les en-têtes d'autorisation (si non géré par un intercepteur)
  private createAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('jwt'); // Ou la manière dont vous stockez votre token
    if (token) {
      // S'assurer que le token est bien formaté (avec ou sans 'Bearer ' selon les besoins de votre intercepteur/backend)
      return new HttpHeaders().set('Authorization', `Bearer ${token.replace(/^Bearer\s+/, '')}`);
    }
    return new HttpHeaders();
  }

  // --- Méthodes pour AddDetailsCourseComponent (généralement pour enseignants/admins) ---

  /**
   * Récupère toutes les pièces jointes générales pour un cours donné.
   * Utilisé par AddDetailsCourseComponent.
   * @param courseId L'ID du cours.
   * @returns Un Observable contenant un tableau d'Attachments.
   */
  getAttachmentsByCourse(courseId: number): Observable<Attachment[]> {
    const url = `${this.baseUrl}/course/${courseId}`; // URL correcte
    console.log('[AttachmentService] getAttachmentsByCourse - URL construite:', url);
    // Pour les opérations générales, le token peut être nécessaire si l'endpoint est protégé
    return this.http.get<Attachment[]>(url, { headers: this.createAuthHeaders() });
  }

  /**
   * Ajoute une nouvelle pièce jointe à un cours.
   * @param courseId L'ID du cours.
   * @param file Le fichier à uploader.
   * @param chapterTitle Le titre du chapitre/de la ressource.
   * @returns Un Observable avec la réponse du serveur (souvent un message texte ou l'objet Attachment créé).
   */
  addAttachment(courseId: number, file: File, chapterTitle: string): Observable<any> {
    const formData = new FormData();
    formData.append('courseId', courseId.toString());
    formData.append('file', file);
    formData.append('chapterTitle', chapterTitle);

    const uploadUrl = `${this.baseUrl}/upload`;
    console.log('[AttachmentService] addAttachment - URL construite:', uploadUrl);
    return this.http.post(uploadUrl, formData, { headers: this.createAuthHeaders(), responseType: 'text' }).pipe(
        catchError(error => {
            console.error('Erreur upload attachment:', error);
            return throwError(() => new Error('Échec de l’upload de la pièce jointe. Détails: ' + (error.error || error.message) ));
        })
    );
  }

  /**
   * Supprime une pièce jointe de manière générale.
   * @param id L'ID de la pièce jointe à supprimer.
   * @returns Un Observable avec un message de confirmation.
   */
  deleteAttachment(id: number): Observable<{ message: string }> {
    const url = `${this.baseUrl}/${id}`;
    console.log('[AttachmentService] deleteAttachment - URL construite:', url);
    return this.http.delete<{ message: string }>(url, { headers: this.createAuthHeaders() });
  }

  /**
   * Met à jour la visibilité générale d'une pièce jointe.
   * @param id L'ID de la pièce jointe.
   * @param visible Le nouveau statut de visibilité.
   * @returns Un Observable avec un message de confirmation (ou l'objet Attachment mis à jour).
   */
  updateVisibility(id: number, visible: boolean): Observable<string> { // Le backend retourne une string
    const url = `${this.baseUrl}/${id}/visibility?visible=${visible}`;
    console.log('[AttachmentService] updateVisibility - URL construite:', url);
    return this.http.put<string>(url, {}, { headers: this.createAuthHeaders() });
  }

  /**
   * Met à jour les détails d'une pièce jointe (titre, fichier, visibilité).
   * @param id L'ID de la pièce jointe à mettre à jour.
   * @param file Le nouveau fichier (optionnel).
   * @param chapterTitle Le nouveau titre.
   * @param visible Le nouveau statut de visibilité.
   * @returns Un Observable avec un message de confirmation.
   */
  updateAttachment(id: number, file: File | null, chapterTitle: string, visible: boolean): Observable<{ message: string }> {
    const formData = new FormData();
    if (file) {
      formData.append('file', file);
    }
    formData.append('chapterTitle', chapterTitle);
    formData.append('visible', visible.toString());

    const url = `${this.baseUrl}/${id}`;
    console.log('[AttachmentService] updateAttachment - URL construite:', url);
    return this.http.put<{ message: string }>(url, formData, { headers: this.createAuthHeaders() });
  }

  // --- Méthodes pour DetailsCourseComponent (spécifiques à l'utilisateur/étudiant) ---

  /**
   * Récupère les pièces jointes d'un cours avec la progression de l'utilisateur actuel.
   * @param courseId L'ID du cours.
   * @returns Un Observable contenant un tableau d'Attachments (ou AttachmentUserProgressDTO si vous l'utilisez).
   */
  getAttachmentsByCourseForUser(courseId: number): Observable<Attachment[]> { // Devrait idéalement retourner AttachmentUserProgressDTO[]
    const url = `${this.baseUrl}/course/${courseId}/user`; // URL correcte
    console.log('[AttachmentService] getAttachmentsByCourseForUser - URL construite:', url);
    return this.http.get<Attachment[]>(url, { headers: this.createAuthHeaders() });
  }

  /**
   * Valide une pièce jointe pour l'utilisateur actuellement authentifié.
   * @param attachmentId L'ID de la pièce jointe.
   * @returns Un Observable avec un message de confirmation.
   */
  validateAttachment(attachmentId: number): Observable<{ message: string }> {
    // Cet endpoint est pour la validation spécifique à l'utilisateur
    const url = `${this.baseUrl}/${attachmentId}/validateForUser`; // URL correcte
    console.log('[AttachmentService] validateAttachment (ForUser) - URL construite:', url);
    return this.http.put<{ message: string }>(url, {}, { headers: this.createAuthHeaders() });
  }

  /**
   * Invalide (annule la validation) d'une pièce jointe pour l'utilisateur actuellement authentifié.
   * @param attachmentId L'ID de la pièce jointe.
   * @returns Un Observable avec un message de confirmation.
   */
  invalidateAttachment(attachmentId: number): Observable<{ message: string }> {
    // Cet endpoint est pour l'invalidation spécifique à l'utilisateur
    const url = `${this.baseUrl}/${attachmentId}/invalidateForUser`; // URL correcte
    console.log('[AttachmentService] invalidateAttachment (ForUser) - URL construite:', url);
    return this.http.put<{ message: string }>(url, {}, { headers: this.createAuthHeaders() });
  }

  /**
   * Met à jour le temps passé par l'utilisateur sur une pièce jointe.
   * @param attachmentId L'ID de la pièce jointe.
   * @param timeSpent L'incrément de temps passé (en millisecondes).
   * @returns Un Observable avec un message de confirmation.
   */
    updateTimeSpent(attachmentId: number, timeSpent: number): Observable<{ message: string }> { // Changed Observable<string> to Observable<{ message: string }>
    const params = new HttpParams().set('timeSpent', timeSpent.toString());
    const url = `${this.baseUrl}/${attachmentId}/timeSpentForUser`;
    console.log('[AttachmentService] updateTimeSpent (ForUser) - URL construite:', url, 'Params:', params.toString());
    return this.http.put<{ message: string }>( // Expect an object with a message property
      url,
      {}, // Empty body for PUT as timeSpent is a RequestParam
      { headers: this.createAuthHeaders(), params: params, responseType: 'json' } // Explicitly set responseType to 'json'
    );
  }

  /**
   * Récupère le score de l'utilisateur actuel pour un cours.
   * @param courseId L'ID du cours.
   * @returns Un Observable contenant le score (nombre).
   */
  getCourseScore(courseId: number): Observable<number> {
    // Cet endpoint est pour le score spécifique à l'utilisateur
    const url = `${this.baseUrl}/course/${courseId}/user/score`; // URL correcte
    console.log('[AttachmentService] getCourseScore (ForUser) - URL construite:', url);
    return this.http.get<number>(url, { headers: this.createAuthHeaders() });
  }

  /**
   * Récupère le temps total passé par l'utilisateur actuel sur un cours.
   * @param courseId L'ID du cours.
   * @returns Un Observable contenant le temps total (nombre en millisecondes).
   */
  getTimeSpentOnCourse(courseId: number): Observable<number> {
    // Cet endpoint est pour le temps total spécifique à l'utilisateur
    const url = `${this.baseUrl}/course/${courseId}/user/timeSpent`; // URL correcte
    console.log('[AttachmentService] getTimeSpentOnCourse (ForUser) - URL construite:', url);
    return this.http.get<number>(url, { headers: this.createAuthHeaders() });
  }

  // --- Méthodes Utilitaires ou Générales (si encore nécessaires) ---

  /**
   * Fournit l'URL pour accéder directement au contenu d'un fichier (visualisation/téléchargement direct par le navigateur).
   * @param attachmentId L'ID de la pièce jointe.
   * @returns L'URL complète du fichier.
   */
  getAttachmentFileUrl(attachmentId: number): string {
    // Cet endpoint est pour le téléchargement/accès direct au fichier
    return `${this.baseUrl}/attachment/${attachmentId}`;
  }
}
