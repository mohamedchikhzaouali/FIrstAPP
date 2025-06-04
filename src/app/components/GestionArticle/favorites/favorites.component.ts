import { Component, OnInit } from '@angular/core';
import { Favorite } from 'src/app/Model/favorite';
import { FavoriteService } from 'src/app/services/ArticleService/favorite.service';

@Component({
  selector: 'app-favorites',
  templateUrl: './favorites.component.html',
  styleUrls: ['./favorites.component.scss']
})
export class FavoritesComponent implements OnInit {
  userId: number = 1; // Set this dynamically based on logged-in user
  favoriteItems: Favorite[] = [];
  loading: boolean = true;
  errorMessage: string = '';

  constructor(private favoriteService: FavoriteService) {}

  ngOnInit(): void {
    this.loadFavorites(this.userId);
  }

  loadFavorites(userId: number): void {
    this.favoriteService.getFavoriteArticles(userId).subscribe(
      (data: Favorite[]) => {
        console.log('Données des favoris:', data);
        this.favoriteItems = data;
        this.loading = false;
      },
      (error) => {
        console.error('Erreur lors du chargement des favoris:', error);
        this.errorMessage = 'Une erreur est survenue lors du chargement de vos articles favoris.';
        this.loading = false;
      }
    );
  }

  removeFavorite(favoriteId: number): void {
    this.favoriteService.removeFavorite(favoriteId).subscribe(
      () => {
        this.favoriteItems = this.favoriteItems.filter(fav => fav.id !== favoriteId);
        console.log('Favorite removed successfully (frontend)');
      },
      (error) => {
        console.error('Error removing favorite:', error);
        this.errorMessage = 'An error occurred while removing the favorite.';
      }
    );
  }

  addFavorite(articleId: number): void {
    this.favoriteService.addFavorite(this.userId, articleId)
      .subscribe((response) => {
        console.log('Article added to favorites', response);
        this.loadFavorites(this.userId);
      }, (error) => {
        console.error('Error adding article to favorites', error);
      });
  }
}