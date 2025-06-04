import { Component,ChangeDetectorRef  } from '@angular/core';
import { DomSanitizer,SafeResourceUrl } from '@angular/platform-browser';
import { UserService } from 'src/app/services/UserServices/user.service';
declare var bootstrap: any;
@Component({
  selector: 'app-users-list',
  templateUrl: './users-list.component.html',
  styleUrls: ['./users-list.component.scss']
})
export class UsersListComponent {

  users: any[] = [];
  user : any;
  selectedRole: string = 'all';
  currentPage: number = 1;
  itemsPerPage: number = 5;
  userCvUrl: SafeResourceUrl | null = null;
  constructor(private userService: UserService, private sanitizer: DomSanitizer,private cdr: ChangeDetectorRef) { }

  ngOnInit() {
    this.loadUsers();
  }
  ngAfterViewInit() {
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
      return new bootstrap.Tooltip(tooltipTriggerEl);
    });
  }

  loadUsers() {
    this.userService.getusers().subscribe(
      (data) => {
        console.log('Users:', data);
        this.users = data;
        console.log('All Users:', this.users); // Added console log
      },
      (error) => {
        console.error('Error fetching users', error);
      }
    );
  }

  loadusercv(user: any) {
    console.log('User clicked:', user);
    this.userCvUrl = null;  // Reset the CV URL before fetching new one

    // Check if the user has a CV field and set it
    if (user?.cv) {
      this.userCvUrl = this.sanitizer.bypassSecurityTrustResourceUrl(user.cv);
      console.log('User CV URL:', this.userCvUrl);  // Log to verify
    } else {
      console.log('No CV available for this user');
    }
  }

  filterContent(role: string) {
    console.log('Selected Role:', role);
    this.selectedRole = role;
    this.currentPage = 1; // Reset to first page
  }

  // Function to approve the teacher
  approveUser(user: any) {
    this.userService.approveTeacher(user.cin).subscribe(
      (response) => {
        console.log('Teacher approved:', response);
        user.status = 'APPROVED';
      },
      (error) => {
        console.error('Error approving teacher:', error);
      }
    );
  }

  declineUser(user: any) {
    this.userService.rejectTeacher(user.cin).subscribe(
      (response) => {
        console.log('Teacher declined:', response);
        this.users = this.users.filter(u => u.cin !== user.cin);
      },
      (error) => {
        console.error('Error declining teacher:', error);
      }
    );
  }

  confirmBan(user: any) {
    if (confirm(`Do you really want to ban ${user.name}?`)) {
      this.ban(user);
    }
  }
  confirmUnBan(user: any) {
    if (confirm(`Do you really want to unban ${user.name}?`)) {
      this.unban(user);
    }
  }
  
  ban(user: any){
    this.userService.banUser(user.email).subscribe(
      (response) => {
        console.log('User banned', response);
        user.banned=true;
        this.cdr.detectChanges();
      },
      (error) => {
        console.error('error banning',error);
      }
    ) ;
   }

   unban(user: any){
    this.userService.unbanUser(user.email).subscribe(
      (response) => {
        console.log('User banned', response);
        user.banned=false;
        this.cdr.detectChanges();
      },
      (error) => {
        console.error('error banning',error);
      }
    ) ;
   }

  getStatusClass(status: string): string {
    switch (status) {
      case 'APPROVED':
        return 'bg-success';
      case 'PENDING':
        return 'bg-warning';
      default:
        return '';
    }
  }

  // PAGINATION
  get pagedUsers(): any[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    let filteredUsers = this.users;

    if (this.selectedRole !== 'all') {
      filteredUsers = this.users.filter(user => user.role.toLowerCase() === this.selectedRole);
    }

    const result = filteredUsers.slice(startIndex, endIndex);
    console.log('Paged Users:', result); // Added console log
    return result;
  }

  get totalPages(): number {
    let filteredUsers = this.users;

    if (this.selectedRole !== 'all') {
      filteredUsers = this.users.filter(user => user.role.toLowerCase() === this.selectedRole);
    }
    return Math.ceil(filteredUsers.length / this.itemsPerPage);
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  
}