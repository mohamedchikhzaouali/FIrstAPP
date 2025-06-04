import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { Location } from '@angular/common';
import { Article } from 'src/app/Model/article';
import { ArticleServiceService } from 'src/app/services/ArticleService/article-service.service';
import { SimilarArticlesService } from 'src/app/services/ArticleService/similar-articles.service';

@Component({
  selector: 'app-article-details',
  templateUrl: './article-details.component.html',
  styleUrls: ['./article-details.component.scss']
})
export class ArticleDetailsComponent implements OnInit {
  article: Article | null = null;
  loading = false;
  error: string | null = null;
  similarArticles: Article[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private articleService: ArticleServiceService,
    private similarArticlesService: SimilarArticlesService,
    private location: Location
  ) { }

  ngOnInit(): void {
    this.loading = true;
    this.route.paramMap.subscribe(params => {
      const articleId = Number(params.get('id'));
      if (articleId) {
        this.loadArticle(articleId);
      } else {
        this.error = 'Article ID not found';
        this.loading = false;
      }
    });
  }

  loadArticle(id: number): void {
    this.articleService.getArticleById(id).subscribe({
      next: (article: Article) => {
        this.article = article;
        this.loading = false;
        
        this.loadSimilarArticles(id);
      },
      error: (error: any) => {
        console.error('Error loading article:', error);
        this.error = 'Error loading article';
        this.loading = false;
      }
    });
  }

  loadSimilarArticles(articleId: number): void {
    this.similarArticlesService.getSimilarArticles(articleId).subscribe({
      next: (articles) => {
        console.log('Similar articles received:', articles);
        this.similarArticles = articles;
        
        // If no similar articles were found, let's log a message
        if (!articles || articles.length === 0) {
          console.log('No similar articles found for article ID:', articleId);
        }
      },
      error: (error: any) => {
        console.error('Error loading similar articles:', error);
      }
    });
  }
  
  // Add a method to debug the tags on the current article
  debugArticleTags(): void {
    if (this.article && this.article.tags) {
      console.log('Current article tags:', this.article.tags);
    } else {
      console.log('Current article has no tags');
    }
  }

  publishDirectly(status: string): void {
    if (!this.article?.id) return;
    
    this.articleService.updateArticleStatus(this.article.id, status as any).subscribe({
      next: (updatedArticle) => {
        console.log(`Article ${this.article?.id} status updated to ${status}`);
        this.article = updatedArticle;
        // Show success message
        alert(`Article status updated to ${status}`);
      },
      error: (error) => {
        console.error(`Error updating article status to ${status}:`, error);
        alert(`Failed to update article status: ${error.message || 'Unknown error'}`);
      }
    });
  }

  archiveArticle(status: string): void {
    if (!this.article?.id) return;
    
    this.articleService.updateArticleStatus(this.article.id, status as any).subscribe({
      next: (updatedArticle) => {
        console.log(`Article ${this.article?.id} archived with status ${status}`);
        this.article = updatedArticle;
        // Show success message
        alert(`Article has been archived`);
      },
      error: (error) => {
        console.error(`Error archiving article with status ${status}:`, error);
        alert(`Failed to archive article: ${error.message || 'Unknown error'}`);
      }
    });
  }

  deleteArticle(id: number | undefined): void {
    if (id && confirm('Are you sure you want to delete this article?')) {
      this.articleService.deleteArticle(id).subscribe({
        next: () => {
          this.router.navigate(['/articles']);
        },
        error: (error: any) => {
          console.error('Error deleting article:', error);
          this.error = 'Error deleting article';
        }
      });
    }
  }

  goBack(): void {
    this.location.back();
  }

  shareOnFacebook(): void {
    if (!this.article) return;
    
    const url = window.location.href;
    const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    window.open(facebookShareUrl, '_blank');
  }

  // Let's add a utility method to manually find similar articles if the API fails
  findSimilarManually(): void {
    if (!this.article || !this.article.id) return;
    
    // Try to find articles with the same category
    this.articleService.getAllArticles().subscribe({
      next: (articles) => {
        // Filter out the current article and limit to 5 articles with the same category
        this.similarArticles = articles
          .filter(a => a.id !== this.article?.id && a.categorie === this.article?.categorie)
          .slice(0, 5);
        
        console.log('Manually found similar articles by category:', this.similarArticles);
      },
      error: (error) => {
        console.error('Error finding similar articles manually:', error);
      }
    });
  }
}