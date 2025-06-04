import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

interface User {  //  Define the User interface to match the data from your /api/users endpoint
  TimeSpentOnCourse: number;
  NumberOfVideosWatched: number;
  NumberOfQuizzesTaken: number;
  QuizScores: number;
  CompletionRate: number;
  DeviceType: number;
  Category_Arts: number;
  Category_Business: number;
  Category_Health: number;
  Category_Programming: number;
  Category_Science: number;
  EngagementRatio: number;
  QuizPerformancePerAttempt: number;
}

interface ClusterResponse {
  cluster: number;
  cluster_name: string;
}

interface User2 {
  UserID: number;
  TimeSpentOnCourse: number;
  NumberOfVideosWatched: number;
  NumberOfQuizzesTaken: number;
  QuizScores: number;
  CompletionRate: number;
  DeviceType: number;
  CourseCompletion:number;
  Category_Arts: number;
  Category_Business: number;
  Category_Health: number;
  Category_Programming: number;
  Category_Science: number;
  EngagementRatio: number;
  QuizPerformancePerAttempt: number;
}
@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrlogin = 'http://localhost:8087/api/authentification';
  private apiUrlprofile = 'http://localhost:8087/api/user';
  private apiUrlsignup='http://localhost:8087/api/auth/signup';
  private apiUrl='http://localhost:8087/api/auth';
  private apiurladmin='http://localhost:8087/api/admin';
  private apiUrlpy = 'http://localhost:5000';

  constructor(private http: HttpClient,private router: Router) { }
  
  //**********USER PROFILE INFO********/
  getUserInfo() {
    let token = localStorage.getItem('jwt');
    
    // Ensure "Bearer" is not duplicated
    if (token?.startsWith('Bearer ')) {
      token = token.replace('Bearer ', '');
    }
  
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get(`${this.apiUrlprofile}/profile`, { headers });
  }


  // MODIFIED: updateUserProfile to send FormData
  updateUserProfile(formData: FormData): Observable<any> {
    let token = localStorage.getItem('jwt');
    if (token?.startsWith('Bearer ')) {
      token = token.replace('Bearer ', '');
    }
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    // IMPORTANT: HttpClient will automatically set Content-Type to multipart/form-data
    // when you send FormData, so DO NOT set it manually.
    return this.http.put(`${this.apiUrlprofile}/update-profile`, formData, { headers });
  }

  // NEW: updatePassword method
  updatePassword(passwordData: { oldPassword: string, newPassword: string }): Observable<any> {
    let token = localStorage.getItem('jwt');
    if (token?.startsWith('Bearer ')) {
      token = token.replace('Bearer ', '');
    }
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.put(`${this.apiUrlprofile}/update-password`, passwordData, { headers });
  }


  //**************User Methods***********/
  login(email: string, password: string, recaptchaToken: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrlogin}/login`, { email, password, recaptchaToken }).pipe(
      tap(response => console.log("Backend response:", response)) // Debugging
    );
  }

  verify2FA(email: string, code: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrlogin}/verify-2fa`, { email, code, password }).pipe(
      tap(response => {
        if (response && response.token) {
          localStorage.setItem('jwt', response.token);
        }
      })
    );
  }

  logout() {
    localStorage.removeItem('jwt');
    this.router.navigate(['/login']);
  }

  signup(formData: FormData): Observable<any> {
    return this.http.post(this.apiUrlsignup, formData);
  }

  sendForgotPasswordEmail(email: string): Observable<any> {
    return this.http.post(`${this.apiUrlogin}/forgot-password`, { email });
  }

  resetPassword(token: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.apiUrlogin}/reset-password/${token}`, { newPassword });
  }

  verifyToken(token:string): Observable<any>{
    return this.http.post(`${this.apiUrlogin}/verify-token/${token}`, {});
  }

  registerFace(userMail: string, faceDescriptor: number[]): Observable<any> {
    let token = localStorage.getItem('jwt');

    // Ensure "Bearer" is not duplicated
    if (token?.startsWith('Bearer ')) {
      token = token.replace('Bearer ', '');
    }
    
    const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`
    });
    const body = { faceDescriptor: faceDescriptor };
    return this.http.post<any>(`${this.apiUrlprofile}/register-face`, body, { headers });
}

loginWithFace(descriptor: number[]): Observable<any> {
  return this.http.post(`${this.apiUrlogin}/face-login`, { faceDescriptor: descriptor });
}

loginWithGoogle(idToken: string) {
  return this.http.post(`${this.apiUrlogin}/google-login`, { idToken });
}

  //********PARTIE ADMIN*********/
  getusers(): Observable<any[]> {
    let token = localStorage.getItem('jwt');  // Directly get the token from localStorage
    // Ensure "Bearer" is not duplicated
    if (token?.startsWith('Bearer ')) {
      token = token.replace('Bearer ', '');
    }
  
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get<any[]>(`${this.apiurladmin}/users`, { headers });
  }
  
  getpendingTeachers():Observable<any[]>{
    return this.http.get<any[]>(`${this.apiurladmin}/pending-teachers`);
  }

  approveTeacher(cin: string): Observable<any> {
    let token = localStorage.getItem('jwt');
    if (token && token.startsWith('Bearer ')) { // Added null check for token
      token = token.replace('Bearer ', '');
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.put(`${this.apiurladmin}/approve-teacher/${cin}`, {}, { headers: headers }); // Corrected line
  }

  rejectTeacher(cin: string): Observable<any> {
    let token = localStorage.getItem('jwt');
    if (token && token.startsWith('Bearer ')) {
      token = token.replace('Bearer ', '');
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.delete(`${this.apiurladmin}/reject-teacher/${cin}`, { headers: headers });
  }

  banUser(email: string): Observable<any> {
  let token = localStorage.getItem('jwt');
  if (token && token.startsWith('Bearer ')) {
    token = token.replace('Bearer ', '');
  }

  const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
  return this.http.put(`${this.apiurladmin}/ban/${email}`, {}, { headers });
}
  unbanUser(email: string): Observable<any> {
  let token = localStorage.getItem('jwt');
  if (token && token.startsWith('Bearer ')) {
    token = token.replace('Bearer ', '');
  }

  const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
  return this.http.put(`${this.apiurladmin}/unban/${email}`, {}, { headers });
}

private createAuthHeaders(): { headers: HttpHeaders } {
  let token = localStorage.getItem('jwt');
  if (token && token.startsWith('Bearer ')) {
    token = token.replace('Bearer ', '');
  }
  const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
  return { headers: headers };
}
getTotalUsers(): Observable<number> {
  return this.http.get<number>(`${this.apiurladmin}/total-users`, this.createAuthHeaders());
}

getActiveUsersLastMonth(): Observable<number> {
  return this.http.get<number>(`${this.apiurladmin}/active-users`, this.createAuthHeaders());
}

getNewUsersToday(): Observable<number> {
  return this.http.get<number>(`${this.apiurladmin}/new-users/today`, this.createAuthHeaders());
}

getUsersByRole(): Observable<{ [key: string]: number }> {
  return this.http.get<{ [key: string]: number }>(`${this.apiurladmin}/users-by-role`, this.createAuthHeaders());
}

getUsersByStatus(): Observable<{ [key: string]: number }> {
  return this.http.get<{ [key: string]: number }>(`${this.apiurladmin}/users-by-status`, this.createAuthHeaders());
}

getActiveUsersPreviousMonth(): Observable<number> {
  return this.http.get<number>(`${this.apiurladmin}/active-users/previous-month`, this.createAuthHeaders());
}
getbanned(): Observable<number> {
  return this.http.get<number>(`${this.apiurladmin}/banned-users`, this.createAuthHeaders());
}


  //*********PARTIE VERIF EMAIL**********/
  sendVerificationEmail(email: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/send-verification-email`, {email: email });
  }

  verifyEmail(email: string, code: string): Observable<any> {
    console.log('Sending verify email request:', { email, code }); // Debugging
    return this.http.post(`${this.apiUrl}/verify-email`, { email, code });
  }

    /*****  DEPLOIEMENT MODELE IA ********/
  getPrediction(features: number[]) {
    return this.http.post<{ prediction: number }>('http://localhost:5000/predict', { features });
  }

  getUserspy(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrlpy}/api/userspypre`);  // Fetch from /api/users
    }

 
 
  getFeatures() {
    return this.http.get<{ features: number[] }>('http://localhost:5000/get-data');
  }

  getUsers(): Observable<{ users: User2[] }> {
    return this.http.get<{ users: User2[] }>(`${this.apiUrlpy}/api/userspy`);
  }

  getCluster(features: number[]): Observable<ClusterResponse> {
    return this.http.post<ClusterResponse>(`${this.apiUrlpy}/cluster`, { features });
  }
 
  // Get recommendation for a user
  getRecommendation(userId: number): Observable<any> {
    return this.http.get(`${this.apiUrlpy}/recommend/${userId}`);
  }

  getRecommendedCourses(recommendation: string) {
    return this.http.get<any[]>(`${this.apiUrlpy}/recommended-courses`, {
      params: { recommendation }
    });
  }
 




}

  