import { Component, OnInit } from '@angular/core';
import { Article } from 'src/app/Model/article';
import { ArticleServiceService } from 'src/app/services/ArticleService/article-service.service';

@Component({
  selector: 'app-back-article',
  templateUrl: './back-article.component.html',
  styleUrls: ['./back-article.component.scss']
})
export class BackArticleComponent implements OnInit {
  topViewedArticles: Article[] = [];
  allArticles: Article[] = [];

  constructor(private articleService: ArticleServiceService) { }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.articleService.getTop5MostViewedArticles().subscribe({
      next: (data) => this.topViewedArticles = data,
      error: (err) => console.error('Error loading top viewed articles:', err)
    });

    this.articleService.getAllArticlesForBackOffice().subscribe({
      next: (data) => {
        this.allArticles = data;
        console.log('All articles loaded:', this.allArticles);
      },
      error: (err) => console.error('Error loading all articles:', err)
    });
  }

  approveArticle(id: number | undefined): void {
    if (id !== undefined) {
      this.articleService.approveArticle(id).subscribe({
        next: (response) => {
          console.log('Article approved successfully:', response);
          this.loadData(); // Reload data to update the list
        },
        error: (err: any) => console.error('Error approving article:', err) // Explicitly type 'err'
      });
    } else {
      console.error('Article ID is undefined');
    }
  }

  deleteArticle(id: number | undefined): void {
    if (id !== undefined) {
      if (confirm('Are you sure you want to delete this article?')) {
        this.articleService.deleteArticle(id).subscribe({
          next: () => {
            console.log('Article deleted successfully');
            this.loadData(); // Reload data to update the list
          },
          error: (err) => console.error('Error deleting article:', err)
        });
      }
    } else {
      console.error('Article ID is undefined');
    }
  }

  updateArticleStatus(id: number | undefined, newStatus: string): void {
    if (id !== undefined) {
      this.articleService.updateArticleStatus(id, newStatus as 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'ARCHIVED').subscribe({
        next: (response) => {
          console.log(`Article ${id} status updated to ${newStatus}`, response);
          this.loadData(); // Reload data to update the list
        },
        error: (err) => console.error(`Error updating article ${id} status:`, err)
      });
    } else {
      console.error('Article ID is undefined');
    }
  }
}