// src/app/components/dashboard-statistics/dashboard-statistics.component.ts

import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import {
    // Imports Chart.js nécessaires
    Chart, ChartData, ChartOptions, DoughnutController, ArcElement,
    BarController, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend
} from 'chart.js';
import { CoursesService } from 'src/app/services/CourseServices/courses.service';
import { ReviewService } from 'src/app/services/CourseServices/review.service';
import { Subscription, forkJoin } from 'rxjs';
import { Review } from 'src/app/Model/CourseModel/Review'; // Assurez-vous que ce modèle est à jour
import Swal from 'sweetalert2';

// --- Palettes de couleurs ---
const professionalColors = ['rgba(54, 162, 235, 0.8)', 'rgba(201, 203, 207, 0.8)'];
const professionalHoverColors = ['rgba(54, 162, 235, 1)', 'rgba(180, 183, 187, 1)'];
const categoryPalette = [ '#4E79A7', '#F28E2B', '#E15759', '#76B7B2', '#59A14F', '#EDC948', '#B07AA1', '#FF9DA7', '#9C755F', '#BAB0AC' ];
const sentimentPalette: { [key: string]: string } = {
    'Positif': '#28a745', 'Négatif': '#dc3545', 'Neutre': '#6c757d',
    'Indéterminé': '#ffc107', 'Erreur': '#adb5bd'
};
const getColor = (index: number): string => categoryPalette[index % categoryPalette.length];

@Component({
  selector: 'app-dashboard-statistics',
  templateUrl: './dashboard-statistics.component.html',
  styleUrls: ['./dashboard-statistics.component.scss']
})
export class DashboardStatisticsComponent implements OnInit, OnDestroy {
  // --- Propriétés Cours ---
  totalCourses: number = 0;
  publishedCourses: number = 0;
  unpublishedCourses: number = 0;
  centerTextLine1: string = '';
  centerTextLine2: string = 'Cours';
  overallChartInstance: Chart<'doughnut', number[], unknown> | null = null;
  categoryDistributionLabels: string[] = [];
  categoryDistributionData: number[] = [];
  categoryDistributionColors: string[] = [];
  categoryDistributionChartInstance: Chart<'doughnut', number[], string> | null = null;
  averageRating: number = 0;
  
  


  // --- Propriétés Avis ---
  reviews: Review[] = [];
  // *** FIX Erreur Type: Propriété déclarée comme Map ***
  sentimentStats: Map<string, number> = new Map(); 
  sentimentChartInstance: Chart<'bar', number[], string> | null = null;

  // --- États ---
  isLoading: boolean = true;
  errorMessage: string | null = null;
  private dataSubscription: Subscription | null = null;

  constructor(
      private coursesService: CoursesService,
      private reviewService: ReviewService,
      private cdRef: ChangeDetectorRef
    ) {
    // Enregistrement Chart.js
    Chart.register(
        DoughnutController, ArcElement, BarController, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend
    );
  }

  ngOnInit(): void {
    this.loadAllStatistics();
  }

  ngOnDestroy(): void {
    this.destroyAllCharts();
    if (this.dataSubscription) {
      this.dataSubscription.unsubscribe();
    }
  }

  loadAllStatistics(): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.destroyAllCharts();

    this.dataSubscription = forkJoin({
      overall: this.coursesService.getCourseStatistics(),
      category: this.coursesService.getCategoryStatistics(),
      sentiments: this.reviewService.getSentimentStatistics(), // Renvoie Observable<Map> mais HttpClient donne objet
      allReviews: this.reviewService.getAllReviews()
    }).subscribe({
      next: (results) => {
        // --- Traitement Stats Cours ---
        const overallStats = results.overall;
        this.totalCourses = overallStats?.totalCourses ?? 0;
        this.publishedCourses = overallStats?.publishedCourses ?? 0;
        this.unpublishedCourses = this.totalCourses - this.publishedCourses;
        this.centerTextLine1 = this.totalCourses.toString();
        this.centerTextLine2 = this.totalCourses === 1 ? 'Cours total' : 'Cours totaux';
        const rawCategoryStats = results.category;
        this.prepareCategoryDistributionData(rawCategoryStats || {});

        // --- Traitement Avis ---
        // *** FIX Erreur Type: Convertir l'objet reçu en Map ***
        const sentimentObject = results.sentiments || {}; 
        this.sentimentStats = new Map(Object.entries(sentimentObject)); 

        this.reviews = results.allReviews || [];
        console.log('Stats Sentiments reçues (stockées comme Map):', this.sentimentStats);
        console.log('Avis reçus pour la liste:', this.reviews.length);

        // --- Création des graphiques ---
        setTimeout(() => {
          this.createOverallChart();
          this.createCategoryDistributionChart();
          this.createSentimentChart();
        }, 0);

        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors de la récupération des données:', error);
        this.errorMessage = "Une erreur s'est produite lors du chargement des données.";
        this.isLoading = false;
      }
    });
  }

  prepareCategoryDistributionData(rawStats: any): void {
    this.categoryDistributionLabels = [];
    this.categoryDistributionData = [];
    this.categoryDistributionColors = [];
    if (typeof rawStats !== 'object' || rawStats === null) { console.warn('Stats catégories invalides'); return; }
    let colorIndex = 0;
    let hasData = false;
    Object.keys(rawStats).forEach(categoryName => {
      const totalInCategory = rawStats[categoryName];
      if (typeof totalInCategory === 'number' && totalInCategory > 0) {
        this.categoryDistributionLabels.push(categoryName);
        this.categoryDistributionData.push(totalInCategory);
        this.categoryDistributionColors.push(getColor(colorIndex++));
        hasData = true;
      }
    });
     console.log('Prepared Category Data:', this.categoryDistributionData);
     if (!hasData) { console.log("Aucune catégorie avec un compte > 0 trouvée."); }
  }

  // *** La méthode calculateSentimentStatistics() est bien SUPPRIMÉE ***

  createOverallChart(): void {
     // *** FIX Erreur Const: Utiliser let ***
     let canvas = document.getElementById('overallChart') as HTMLCanvasElement;
     if (!canvas) { console.error("Canvas 'overallChart' non trouvé."); return; }
     if (this.publishedCourses === 0 && this.unpublishedCourses === 0) { return; }
     
     // Définition de chartData avec la propriété 'datasets' requise
     const chartData: ChartData<'doughnut', number[], unknown> = {
        labels: ['Cours Publiés', 'Cours Non Publiés'],
        datasets: [{ // <-- datasets est présent
            label: 'Cours Globaux', 
            data: [this.publishedCourses, this.unpublishedCourses], 
            backgroundColor: professionalColors, 
            borderColor: professionalColors.map(c=>c.replace('0.8','1')), 
            hoverBackgroundColor: professionalHoverColors, 
            hoverBorderColor: professionalHoverColors.map(c=>c.replace('0.8','1')), 
            borderWidth: 1, 
            hoverOffset: 8 
        }]
     };
     const chartOptions: ChartOptions<'doughnut'> = { responsive: true, maintainAspectRatio: false, cutout: '70%', animation: {animateRotate: true, animateScale: true}, plugins:{ legend:{ display: true, position: 'bottom', labels: {boxWidth:15, padding:15, font:{size:11}}}, tooltip:{ enabled: true, backgroundColor:'rgba(0,0,0,0.85)', padding: 10, callbacks: { label: (ctx) => `${ctx.label}: ${ctx.parsed} cours` }} } };
     
     if(this.overallChartInstance) { this.overallChartInstance.destroy(); } // Détruire l'ancien avant de créer
     this.overallChartInstance = new Chart(canvas, { type: 'doughnut', data: chartData, options: chartOptions });
     console.log("Graphique Global créé.");
  }

  createCategoryDistributionChart(): void {
     // *** FIX Erreur Const: Utiliser let ***
     let canvas = document.getElementById('categoryDistributionChart') as HTMLCanvasElement;
     if (!canvas || this.categoryDistributionData.length === 0) { return; }
     
     // Définition de chartData avec la propriété 'datasets' requise
     const chartData: ChartData<'doughnut', number[], string> = {
        labels: this.categoryDistributionLabels,
        datasets: [{ // <-- datasets est présent
            label: 'Cours par Catégorie', 
            data: this.categoryDistributionData, 
            backgroundColor: this.categoryDistributionColors, 
            borderColor: this.categoryDistributionColors, 
            hoverBackgroundColor: this.categoryDistributionColors.map(c => `${c}E6`), 
            hoverBorderColor: this.categoryDistributionColors, 
            borderWidth: 1, 
            hoverOffset: 8 
        }]
     };
     const chartOptions: ChartOptions<'doughnut'> = { responsive: true, maintainAspectRatio: false, cutout: '60%', plugins:{ legend:{ display: true, position: 'bottom', align: 'center', labels:{boxWidth:15, padding:15, font:{size:11}}}, tooltip:{ enabled: true, backgroundColor:'rgba(0,0,0,0.8)', padding:10, cornerRadius:4, usePointStyle:true, callbacks: { label: (ctx) => {const total = ctx.chart.data.datasets[0].data.reduce((acc: number, cur) => (typeof cur === 'number' ? acc + cur : acc), 0); const percentage = total > 0 ? ((ctx.parsed / total) * 100).toFixed(1) : 0; return `${ctx.label}: ${ctx.parsed} cours (${percentage}%)`;} } }} };
     
     if(this.categoryDistributionChartInstance) { this.categoryDistributionChartInstance.destroy(); } // Détruire l'ancien avant de créer
     this.categoryDistributionChartInstance = new Chart(canvas, { type: 'doughnut', data: chartData, options: chartOptions });
     console.log("Graphique Catégories créé.");
  }

  createSentimentChart(): void {
      // *** FIX Erreur Const: Utiliser let ***
      let canvas = document.getElementById('sentimentChart') as HTMLCanvasElement;
      const container = document.querySelector('.sentiment-chart-container');
      
      // Nettoyer et re-sélectionner le canvas
      if(container) {
          container.innerHTML = '<canvas id="sentimentChart"></canvas>'; 
          canvas = document.getElementById('sentimentChart') as HTMLCanvasElement; 
      }

      if (!canvas) { console.error("Canvas 'sentimentChart' non trouvé."); return; }
      
      // Utiliser this.sentimentStats (qui est un Map)
      if (!this.sentimentStats || this.sentimentStats.size === 0) {
          console.log("Saut création graphique sentiments: Pas de données Map.");
          if(container) container.innerHTML = '<p class="no-data-message">Aucune statistique de sentiment à afficher.</p>';
           if (this.sentimentChartInstance) { this.sentimentChartInstance.destroy(); this.sentimentChartInstance = null; }
          return;
      }

      // Préparer données depuis le Map, en filtrant les zéros
      const filteredLabels: string[] = [];
      const filteredData: number[] = [];
      const backgroundColors: string[] = [];
      this.sentimentStats.forEach((count, label) => { // Itération sur le Map
          if (count > 0) {
              filteredLabels.push(label);
              filteredData.push(count);
              backgroundColors.push(sentimentPalette[label] || '#cccccc');
          }
      });
      
      if (filteredLabels.length === 0) { 
           console.log("Aucune statistique de sentiment avec compte > 0.");
           if(container) container.innerHTML = '<p class="no-data-message">Aucune statistique de sentiment à afficher.</p>';
           if (this.sentimentChartInstance) { this.sentimentChartInstance.destroy(); this.sentimentChartInstance = null; }
           return; 
      }

      const chartData: ChartData<'bar', number[], string> = {
          labels: filteredLabels,
          datasets: [{ // <-- datasets est présent
              label: 'Nombre d\'avis', data: filteredData, backgroundColor: backgroundColors,
              borderColor: backgroundColors.map(c => c + 'FF'), borderWidth: 1, borderRadius: 4
          }]
      };
      const chartOptions: ChartOptions<'bar'> = {
          responsive: true, maintainAspectRatio: false, indexAxis: 'y',
          scales: {
              x: { beginAtZero: true, title: { display: true, text: 'Nombre d\'avis' }, ticks: { stepSize: 1 } },
              y: { title: { display: false } }
          },
          plugins: {
              legend: { display: false },
              title: { display: true, text: 'Distribution des Sentiments', font: { size: 16 }, padding: { bottom: 15 } },
              tooltip: { enabled: true, callbacks: { label: (context) => ` ${context.parsed.x} avis` } }
          }
      };

      if(this.sentimentChartInstance) { this.sentimentChartInstance.destroy(); } // Détruire l'ancien avant de créer
      try {
           this.sentimentChartInstance = new Chart(canvas, { type: 'bar', data: chartData, options: chartOptions });
           console.log("Graphique des sentiments créé avec succès.");
      } catch (error) { 
           console.error("Erreur lors de la création du graphique des sentiments:", error);
            if(container) container.innerHTML = '<p class="error-message">Erreur lors de l\'affichage du graphique des sentiments.</p>';
      }
  }

  // Destruction de tous les graphiques (inchangé)
  destroyAllCharts(): void {
    if (this.overallChartInstance) { this.overallChartInstance.destroy(); this.overallChartInstance = null; }
    if (this.categoryDistributionChartInstance) { this.categoryDistributionChartInstance.destroy(); this.categoryDistributionChartInstance = null; }
    if (this.sentimentChartInstance) { this.sentimentChartInstance.destroy(); this.sentimentChartInstance = null; }
  }

  deleteReview(reviewId?: number): void {
    // 1. Vérifier si l'ID est fourni
    if (!reviewId) {
      console.warn("Tentative de suppression d'un avis sans ID.");
      Swal.fire(
        'Information',
        "Impossible de supprimer cet avis car son ID n'est pas connu. Veuillez rafraîchir la page.",
        'info'
      );
      return;
    }

    // 2. Afficher la boîte de dialogue de confirmation SweetAlert
    Swal.fire({
      title: 'Êtes-vous sûr ?',
      text: "Cette action est irréversible !",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33', // Rouge pour la suppression
      cancelButtonColor: '#3085d6', // Bleu pour annuler
      confirmButtonText: 'Oui, supprimer !',
      cancelButtonText: 'Annuler'
    }).then((result) => {
      // 3. Traiter le résultat
      if (result.isConfirmed) {
        // 4. Si confirmé, appeler le service de suppression
        this.reviewService.deleteReview(reviewId).subscribe({
          next: () => {
            // 5. Succès: Mettre à jour la liste locale
            const updatedReviews = this.reviews.filter(review => review.idReview !== reviewId);
            this.reviews = updatedReviews; // Remplacer par le nouveau tableau

            // Recalculer la note moyenne
            this.calculateAverageRating();

            // Logs de débogage
            console.log('--- Dans deleteReview (après MAJ locale) ---');
            console.log('Avis supprimé avec succès (ID:', reviewId, ')');
            console.log('Nouvelle longueur this.reviews:', this.reviews.length);
            console.log('Nouvelle Valeur this.averageRating:', this.averageRating);
            console.log('---------------------------------------------');

            // Forcer la détection des changements pour mettre à jour l'UI
            this.cdRef.detectChanges();

            // Afficher message de succès
            Swal.fire(
              'Supprimé !',
              'L\'avis a été supprimé.',
              'success'
            );
            
            // Optionnel: Mettre à jour les graphiques si la suppression a un impact
            // this.createSentimentChart(); // Par exemple, si les stats de sentiments doivent changer
          },
          error: (err) => {
            // 6. Erreur lors de la suppression
            console.error("Erreur suppression avis:", err);
            Swal.fire(
              'Erreur !',
              'La suppression de l\'avis a échoué. Veuillez réessayer.',
              'error'
            );
          }
        });
      } else {
        // 7. Si annulé
        console.log('Suppression annulée pour l\'avis ID:', reviewId);
      }
    });
  }
    calculateAverageRating(): void {
      if (this.reviews && this.reviews.length > 0) {
      const totalRating = this.reviews.reduce((sum, review) => sum + review.rating, 0);
      if (isNaN(totalRating)) {
        console.error("Erreur dans calculateAverageRating: totalRating est NaN. Vérifiez les données d'avis.", this.reviews);
        this.averageRating = 0;
      } else {
        this.averageRating = totalRating / this.reviews.length;
      }
    } else {
      this.averageRating = 0;
    }
  }
}