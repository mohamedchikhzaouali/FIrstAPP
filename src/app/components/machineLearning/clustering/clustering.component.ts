import { Component, OnInit } from '@angular/core';
import { from, of } from 'rxjs';
import { concatMap, delay } from 'rxjs/operators';
import { UserService } from 'src/app/services/UserServices/user.service';

interface User2 {
  UserID: number;
  TimeSpentOnCourse: number;
  NumberOfVideosWatched: number;
  NumberOfQuizzesTaken: number;
  QuizScores: number;
  CompletionRate: number;
  DeviceType: number;
  CourseCompletion: number;
  Category_Arts: number;
  Category_Business: number;
  Category_Health: number;
  Category_Programming: number;
  Category_Science: number;
  EngagementRatio: number;
  QuizPerformancePerAttempt: number;
  cluster?: number | string;
  cluster_name?: string;
}

@Component({
  selector: 'app-clustering',
  templateUrl: './clustering.component.html',
  styleUrls: ['./clustering.component.scss']
})
export class ClusteringComponent implements OnInit {
  users: User2[] = [];
  batchSize = 100;
  currentPage: number = 1;
  itemsPerPage: number = 8;
  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.fetchUsers();
  }

  fetchUsers(): void {
    this.userService.getUsers().subscribe({
      next: (response) => {
        this.users = response.users;
        console.log('Users data:', this.users);
      },
      error: (err) => {
        console.error('Error fetching users:', err);
      }
    });
  }

  getClustersForAllUsers(): void {
    const userBatches = this.chunkArray(this.users, this.batchSize);

    from(userBatches)
      .pipe(
        concatMap((batch, batchIndex) =>
          from(batch).pipe(
            concatMap((user, index) => {
              const i = batchIndex * this.batchSize + index;
              const features = [
                user.UserID,
                user.TimeSpentOnCourse,
                user.NumberOfVideosWatched,
                user.NumberOfQuizzesTaken,
                user.QuizScores,
                user.CompletionRate,
                user.DeviceType,
                user.CourseCompletion,
                user.Category_Arts,
                user.Category_Business,
                user.Category_Health,
                user.Category_Programming,
                user.Category_Science,
                user.EngagementRatio,
                user.QuizPerformancePerAttempt,
              ];

              return this.userService.getCluster(features).pipe(
                // Slight delay prevents backend overload
                delay(20),
                concatMap((response) => {
                  this.users[i] = {
                    ...this.users[i],
                    cluster: response?.cluster ?? '-',
                    cluster_name: response?.cluster_name ?? '-'
                  };
                  return of(null); // continue next user
                })
              );
            })
          )
        )
      )
      .subscribe({
        complete: () => {
          console.log('All users clustered!');
        },
        error: (err) => {
          console.error('Error during clustering:', err);
        }
      });
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const result: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      result.push(array.slice(i, i + size));
    }
    return result;
  }


  // PAGINATION
  get pagedUsers(): any[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    let filteredUsers = this.users;

    

    const result = filteredUsers.slice(startIndex, endIndex);
    console.log('Paged Users:', result); // Added console log
    return result;
  }

  get totalPages(): number {
    let filteredUsers = this.users;

    return Math.ceil(filteredUsers.length / this.itemsPerPage);
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

}
