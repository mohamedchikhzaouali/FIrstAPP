import { Component, OnInit } from '@angular/core';
import { StudentQuizService } from 'src/app/services/QuizServices/student-quiz-service.service';
import { QuizService } from 'src/app/services/QuizServices/quiz.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-stripe-payment',
  templateUrl: './stripe-payment.component.html',
  styleUrls: ['./stripe-payment.component.scss']
})
export class StripePaymentComponent implements OnInit {
  quizId: number | null = null;
  quizPrice: number | null = null;

  constructor(private studentQuizService: StudentQuizService, private quizService: QuizService, private router: Router, private route: ActivatedRoute) {
    this.route.queryParams.subscribe(params => {
      this.quizId = params['quizId'];
    });
  }

  ngOnInit() {
    if (this.quizId !== null) {
      this.quizService.getQuizById(this.quizId).subscribe(
        quiz => {
          this.quizPrice = quiz.price;
        },
        error => {
          console.error("Erreur lors de la récupération du quiz :", error);
          this.router.navigate(['/payment-failed']);
        }
      );
    }
  }

  async payWithStripe() {
    if (this.quizId === null || this.quizPrice === null) {
      console.error("quizId ou quizPrice est null. Impossible de procéder au paiement.");
      return;
    }

    this.studentQuizService.createCheckoutSession(this.quizPrice, 'usd', this.quizId).subscribe(
      sessionUrl => {
        window.location.href = sessionUrl;
      },
      error => {
        console.error("Erreur Stripe :", error);
        this.router.navigate(['/payment-failed']);
      }
    );
  }
}