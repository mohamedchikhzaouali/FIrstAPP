import { Component } from '@angular/core';
import { UserService } from 'src/app/services/UserServices/user.service';

@Component({
  selector: 'app-back-header',
  templateUrl: './back-header.component.html',
  styleUrls: ['./back-header.component.scss']
})
export class BackHeaderComponent {
constructor(private userService: UserService) {}
      user: any;
    
      ngOnInit(): void {
        this.userService.getUserInfo().subscribe(
          (data) => {
            this.user = data;  // Store user data
          },
          (error) => {
            console.error('Error fetching user data:', error);
          }
        );
      }
  
      logout() {
        this.userService.logout();
      }
}
