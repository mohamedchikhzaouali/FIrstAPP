import { Component, OnInit } from '@angular/core';
import { tap } from 'rxjs/operators'; // Import tap
import { UserService } from 'src/app/services/UserServices/user.service';

interface User {  // Define the User interface in the component as well
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
    prediction?: number;
}

@Component({
    selector: 'app-prediction',
    templateUrl: './prediction.component.html',
    styleUrls: ['./prediction.component.scss']
})
export class PredictionComponent implements OnInit {
    users: User[] = [];
    prediction: any;
    features: number[] = []; // Array to store the features
    displayedUsers: User[] = [];

    constructor(private predictionService: UserService) { }

    ngOnInit(): void {
        this.loadUsers();
        console.log('Users data in component:', this.users);
    }

    loadUsers() {
        this.predictionService.getUserspy().subscribe(
            (data:any) => {
                this.users = data.users;
                this.displayedUsers = this.users.slice(0, 10);
                console.log('Users data in component:', this.displayedUsers);
            },
            (error) => {
                console.error('Error fetching users:', error);
            }
        );
    }

    predictForUser(user: User) {
        const features = [
            user.TimeSpentOnCourse,
            user.NumberOfVideosWatched,
            user.NumberOfQuizzesTaken,
            user.QuizScores,
            user.CompletionRate,
            user.DeviceType,
            user.Category_Arts,
            user.Category_Business,
            user.Category_Health,
            user.Category_Programming,
            user.Category_Science,
            user.EngagementRatio,
            user.QuizPerformancePerAttempt,
        ];
        this.predictionService.getPrediction(features).pipe(
            tap(response => {  // Use tap here
              user.prediction = response.prediction;
            })
        ).subscribe(
            () => { },
            (error) => {
                console.error('Prediction error', error);
            }
        );
    }
}
