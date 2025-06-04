import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Review } from 'src/app/Model/CourseModel/Review';
import { ReviewService } from '../../../services/CourseServices/review.service';

@Component({
  selector: 'app-list-review',
  templateUrl: './list-review.component.html',
  styleUrls: ['./list-review.component.scss']
})
export class ListReviewComponent implements OnInit {
  courseId!: number;
  reviews: Review[] = [];

  constructor(private reviewService: ReviewService, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.courseId = Number(this.route.snapshot.paramMap.get('courseId')); // Récupération de l'ID du cours
    this.loadReviews();
  }

  // Charger les avis du cours
  loadReviews(): void {
    if (!this.courseId) return;
    this.reviewService.getReviewsByCourse(this.courseId).subscribe(
      (data) => {
        console.log('✅ Avis chargés avec succès', data);
        this.reviews = data;
      },
      (error) => {
        console.error('❌ Erreur lors du chargement des avis :', error);
      }
    );
  }

  // Supprimer un avis
  deleteReview(reviewId: number): void {
    if (confirm('Voulez-vous vraiment supprimer cet avis ?')) {
      this.reviewService.deleteReview(reviewId).subscribe(
        () => {
          console.log('✅ Avis supprimé avec succès');
          this.reviews = this.reviews.filter((review) => review.idReview !== reviewId);
        },
        (error) => {
          console.error('❌ Erreur lors de la suppression de l’avis :', error);
        }
      );
    }
  }
}