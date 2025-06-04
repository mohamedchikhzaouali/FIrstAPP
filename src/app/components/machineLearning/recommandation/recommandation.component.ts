import { Component } from '@angular/core';
import { UserService } from 'src/app/services/UserServices/user.service';

@Component({
  selector: 'app-recommandation',
  templateUrl: './recommandation.component.html',
  styleUrls: ['./recommandation.component.scss']
})
export class RecommandationComponent {
  recommendation: string | null = null;
  selectedUserId: number = 0;
  recommendedCourses: any[] = [];
  quizScore: number | null = null;

  constructor(private userService: UserService) {}

  getCourseRecommendation(userId: number): void {
    this.userService.getRecommendation(userId).subscribe({
      next: (response) => {
        this.recommendation = response.recommendation;
        this.quizScore = response.quiz_score; 
        console.log('Recommendation:', this.recommendation);

        if (this.recommendation) {
          this.userService.getRecommendedCourses(this.recommendation).subscribe({
            next: (courses) => {
              // Filter courses based on quiz score
              this.recommendedCourses = this.filterCoursesByScore(courses);
              console.log('Filtered Courses:', this.recommendedCourses);
            },
            error: (err) => {
              console.error('Error fetching courses', err);
            }
          });
        }
      },
      error: (error) => {
        console.error('Error getting recommendation', error);
        this.recommendation = 'Error fetching recommendation';
      }
    });
  }

  filterCoursesByScore(courses: any[]): any[] {
  if (this.quizScore === null) return [];

  console.log("Filtered Courses based on score:", this.quizScore);

  let filteredCourses: any[] = [];

  if (this.quizScore < 55) {
    filteredCourses = courses.filter(course => course.level === 'Débutant');
  } else if (this.quizScore < 80) {
    filteredCourses = courses.filter(course => course.level === 'Intermédiaire');
  } else {
    filteredCourses = courses.filter(course => course.level !== 'Débutant' && course.level !== 'Intermédiaire');
  }

  console.log("Courses after filtering:", filteredCourses);

  return filteredCourses;
}

}
