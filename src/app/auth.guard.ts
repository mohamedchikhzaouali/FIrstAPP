import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    const token = localStorage.getItem('jwt'); 

    // Allow access to the login and signup routes even if the user is not authenticated
    if (state.url === '/login' || state.url === '/signup'|| state.url === '/reset-password') {
      return true;
    }

    // If the user is not authenticated, block access to all other routes and redirect to login
    if (!token) {
      this.router.navigate(['/login']);  // Redirect to login
      return false;
    }

    const decodedToken = this.decodeToken(token);
    const userRoles: string[] = decodedToken?.roles || [];
    if (state.url === '/dashboard' && !userRoles.includes('ROLE_ADMIN')) {
      // If the user is not an ADMIN, redirect to a different page (e.g., home or login)
      this.router.navigate(['/profile']);  // Or another route for non-ADMIN users
      return false;
    }

    // If the user is authenticated, allow access to all routes
    return true;
  }

  private decodeToken(token: string): any {
    try {
      // Decode the JWT token to extract user data (use a proper decoding library if needed)
      const payload = token.split('.')[1];  // Get the payload part of the JWT
      const decoded = atob(payload);  // Decode base64 payload
      return JSON.parse(decoded);  // Parse the JSON string into an object
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;  // Return null if decoding fails
    }
  }
}
