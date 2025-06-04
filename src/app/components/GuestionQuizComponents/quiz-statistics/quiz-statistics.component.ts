import { Component, OnInit } from '@angular/core';
import { StudentQuizService } from 'src/app/services/QuizServices/student-quiz-service.service';
import { ChartData, ChartType } from 'chart.js';

@Component({
  selector: 'quiz-statistics',
  templateUrl: './quiz-statistics.component.html',
  styleUrls: ['./quiz-statistics.component.scss']
})
export class QuizStatisticsComponent implements OnInit {
  quizStatistics: any[] = [];
  pieChartType: ChartType = 'pie';

  constructor(private studentQuizService: StudentQuizService) {}

  ngOnInit(): void {
    this.fetchQuizStatistics();
  }

  fetchQuizStatistics(): void {
    this.studentQuizService.getQuizStatistics().subscribe((data: any[]) => {
      this.quizStatistics = data.map(quiz => ({
        title: quiz.title,
        successRate: quiz.successRate,
        failureRate: 100 - quiz.successRate,
        pieChartData: {
          labels: ['Succès', 'Échec'],
          datasets: [{
            data: [quiz.successRate, 100 - quiz.successRate],
            backgroundColor: ['green', 'red']
          }]
        }
      }));
    });
  }
}