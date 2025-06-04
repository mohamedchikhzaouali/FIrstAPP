import { Component, HostListener } from '@angular/core';
import { UserService } from 'src/app/services/UserServices/user.service';

@Component({
  selector: 'app-front-header-teacher',
  templateUrl: './front-header-teacher.component.html',
  styleUrls: ['./front-header-teacher.component.scss']
})
export class FrontHeaderTeacherComponent {
  @HostListener('window:scroll', [])
  onWindowScroll() {
    const header = document.querySelector('.header-area');
    if (header) {
      if (window.scrollY > 50) { // Change à 50px de scroll
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    }
  }

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
