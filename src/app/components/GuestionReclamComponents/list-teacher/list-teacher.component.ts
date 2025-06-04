import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ReclamationService } from 'src/app/services/ReclamServices/reclamation.service';
import { AuthService } from 'src/app/AuthService';
import { Observable, Subscription } from 'rxjs';

@Component({
  selector: 'app-list-teacher',
  templateUrl: './list-teacher.component.html',
  styleUrls: ['./list-teacher.component.scss']
})
export class ListTeacherComponent implements OnInit {
    userRole$: Observable<string | null>;
    reclamations: any[] = [];
    reclamationEnCours: any = null;
    objet: string = '';
    userRolel: string | null = null;
  
    // Configuration du graphique en barres
    public barChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
        },
      },
    };
    public barChartLabels = ['Traité', 'Non traité'];
    public barChartData: number[] = [0, 0];
  
    constructor(
      private reclamationService: ReclamationService,
      private router: Router,
      private authService: AuthService
    ) {
        this.userRole$ = this.authService.userRole$;
    }
  
    ngOnInit(): void {
      this.userRole$.subscribe(role => {
            console.log('Rôle actuel (AppComponent):', role);
        });

      this.loadReclamations();
    }
  
    loadReclamations(): void {
      this.reclamationService.getReclamationUser().subscribe(
        (data) => {
          this.reclamations = data.reverse(); // Inverser l'ordre des réclamations
          this.calculateStatistics(); // Calculer les statistiques après le chargement
          this.filterReclamations();  // Appliquer la recherche après avoir chargé les réclamations
        },
        (error) => {
          console.error('Error while retrieving the claims', error);
        }
      );
    }
  
    filterReclamations(): void {
      // Filtrer les réclamations selon l'objet et la description
      if (this.objet && this.objet.trim() !== '') {
        this.reclamations = this.reclamations.filter(
          (reclamation) =>
            reclamation.objet.toLowerCase().includes(this.objet.toLowerCase()) ||
            reclamation.description.toLowerCase().includes(this.objet.toLowerCase())
        );
      }
    }
  
    supprimerReclamation(id: number): void {
      if (confirm("Are you sure you want to delete this claim?")) {
        this.reclamationService.supprimerReclamation(id).subscribe(
          () => {
            this.loadReclamations();
          },
          (error) => {
            console.error("Error while deleting the claim", error);
          }
        );
      }
    }
  
    modifierStatut(reclamation: any): void {
      this.reclamationService.modifierReclamation(reclamation).subscribe(
        () => {
          console.log("Status updated successfully");
          this.calculateStatistics(); // Recalculer les statistiques après modification
        },
        (error) => {
          console.error("Error while updating the status", error);
        }
      );
    }
  
    calculateStatistics(): void {
      const treatedCount = this.reclamations.filter(r => r.statut === 'traité').length;
      const untreatedCount = this.reclamations.filter(r => r.statut === 'non traité').length;
  
      this.barChartData = [treatedCount, untreatedCount];
    }
  
    goToAddReclamation() {
      this.router.navigate(['/add-claim']);  // Redirige vers la route 'ajouter-reclamation'
    }
  }
  


