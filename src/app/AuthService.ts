import { Injectable } from '@angular/core';
import { jwtDecode, JwtPayload } from 'jwt-decode'; // Importer JwtPayload pour un typage plus précis
import { BehaviorSubject, Observable } from 'rxjs';

// Interface pour typer le contenu décodé du token, incluant 'sub' et 'roles'
interface DecodedToken extends JwtPayload {
  roles?: string[];
  // Ajoutez ici d'autres claims personnalisées si votre token en contient (ex: idP)
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private userRoleSubject = new BehaviorSubject<string | null>('GUEST');
  public userRole$: Observable<string | null> = this.userRoleSubject.asObservable();

  // Ajout pour userId$ (qui contiendra l'email de la claim 'sub')
  private userIdSubject = new BehaviorSubject<string | null>(null);
  public userId$: Observable<string | null> = this.userIdSubject.asObservable();

  constructor() {
    this.loadUserDataFromToken(); // Renommé pour plus de clarté
  }

  private loadUserDataFromToken(): void {
    const token = localStorage.getItem('jwt');
    if (token) {
      try {
        const decodedToken: DecodedToken = jwtDecode(token);

        // Gestion du rôle utilisateur
        const userRoles: string[] = decodedToken?.roles || [];
        if (userRoles.includes('ROLE_TEACHER')) {
          this.userRoleSubject.next('TEACHER');
        } else if (userRoles.includes('ROLE_STUDENT')) {
          this.userRoleSubject.next('STUDENT');
        } else if (userRoles.includes('ROLE_ADMIN')) { // Ajout pour le rôle ADMIN si nécessaire
            this.userRoleSubject.next('ADMIN');
        }
        else {
          this.userRoleSubject.next('GUEST');
        }
        console.log('Rôle de l\'utilisateur récupéré du token (service):', this.userRoleSubject.value);

        // Gestion de l'identifiant utilisateur (email depuis la claim 'sub')
        const userIdFromToken = decodedToken.sub; // 'sub' contient généralement l'identifiant principal (email ici)
        this.userIdSubject.next(userIdFromToken || null);
        console.log('ID utilisateur (sub/email) récupéré du token (service):', this.userIdSubject.value);

      } catch (error) {
        console.error('Erreur lors du décodage du token (service):', error);
        this.userRoleSubject.next('GUEST');
        this.userIdSubject.next(null); // Réinitialiser userId en cas d'erreur
      }
    } else {
      this.userRoleSubject.next('GUEST');
      this.userIdSubject.next(null); // Réinitialiser userId si pas de token
      console.log('Aucun JWT trouvé dans le localStorage (service).');
    }
  }

  // Méthode pour mettre à jour les données utilisateur (par exemple, après une connexion)
  updateUserAuthState(): void { // Renommé pour plus de clarté
    this.loadUserDataFromToken();
  }

  hasRole(role: string): boolean {
    return this.userRoleSubject.value === role;
  }

  // Méthode pour effacer les données utilisateur lors de la déconnexion
  clearUserAuthState(): void {
    this.userRoleSubject.next('GUEST');
    this.userIdSubject.next(null);
    // localStorage.removeItem('jwt'); // Déjà géré dans UserService.logout()
  }

  // Optionnel: un getter pour la valeur actuelle de l'ID utilisateur si nécessaire en dehors d'un contexte Observable
  getCurrentUserId(): string | null {
    return this.userIdSubject.value;
  }
}