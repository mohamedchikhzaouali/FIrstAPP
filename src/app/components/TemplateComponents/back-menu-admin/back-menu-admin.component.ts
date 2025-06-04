import { Component } from '@angular/core';
import { UserService } from 'src/app/services/UserServices/user.service';

@Component({
  selector: 'app-back-menu-admin',
  templateUrl: './back-menu-admin.component.html',
  styleUrls: ['./back-menu-admin.component.scss']
})
export class BackMenuAdminComponent {
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
