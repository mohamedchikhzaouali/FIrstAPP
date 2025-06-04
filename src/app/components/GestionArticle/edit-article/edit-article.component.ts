import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Article } from 'src/app/Model/article';
import { Ressource } from 'src/app/Model/ressource';
import { ArticleServiceService } from 'src/app/services/ArticleService/article-service.service';

@Component({
  selector: 'app-edit-article',
  templateUrl: './edit-article.component.html',
  styleUrls: ['./edit-article.component.scss']
})
export class EditArticleComponent implements OnInit {
  article: Article = {
    title: '',
    date: new Date().toISOString().split('T')[0],
    categorie: 'NEWS',
    status: true,
    views: 0,
    numberShares: 0,
    ressources: [],
    user: { id: 1 },
    published: false,
    scheduled: false,
    publicationStatus: 'DRAFT' // Initialisation par défaut
  };

  publicationStatuses: string[] = ['DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'ARCHIVED'];
  newResource: Ressource = {
    description: '',
    video: '',
    pdf: '',
    picture: ''
  };

  loading = false;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private articleService: ArticleServiceService
  ) { }

  ngOnInit(): void {
    this.loading = true;
    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      this.articleService.getArticleById(Number(id)).subscribe({
        next: (article) => {
          console.log('Loaded article:', article);
          this.article = {
            ...article,
            ressources: article.ressources || []
          };
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading article:', error);
          this.error = 'Error loading article details';
          this.loading = false;
        }
      });
    }
  }

  addResource(): void {
    if (!this.article.ressources) {
      this.article.ressources = [];
    }
    this.article.ressources.push({...this.newResource});
    this.newResource = {
      description: '',
      video: '',
      pdf: '',
      picture: ''
    };
  }

  removeResource(index: number): void {
    if (this.article.ressources) {
      this.article.ressources.splice(index, 1);
    }
  }

  onSubmit(): void {
    if (this.article.id) {
      const articleToUpdate = {
        ...this.article,
        ressources: this.article.ressources || []
      };

      console.log('Submitting update for article:', articleToUpdate);

      this.articleService.updateArticle(this.article.id, articleToUpdate).subscribe({
        next: (response) => {
          console.log('Article updated successfully:', response);
          this.router.navigate(['/articles']);
        },
        error: (error) => {
          console.error('Error details:', error);
          if (error.status === 200 || error.status === 204) {
            console.log('Update successful (no content)');
            this.router.navigate(['/articles']);
          } else {
            this.error = `Error updating article: ${error.message || 'Unknown error'}`;
          }
        }
      });
    } else {
      this.error = 'Cannot update article: No ID provided';
    }
  }

  cancel(): void {
    this.router.navigate(['/articles']);
  }

  // Méthode pour changer le statut de publication
  changePublicationStatus(newStatus: 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'ARCHIVED'): void {
    if (this.article.id) {
      this.articleService.updateArticleStatus(this.article.id, newStatus).subscribe({
        next: (response) => {
          console.log('Publication status updated:', response);
          this.article.publicationStatus = response.publicationStatus; // Mettre à jour l'état localement
          // Optionally, display a success message
        },
        error: (error) => {
          console.error('Error updating publication status:', error);
          this.error = `Error updating publication status: ${error.message || 'Unknown error'}`;
        }
      });
    } else {
      this.error = 'Cannot update publication status: No ID provided';
    }
  }
}