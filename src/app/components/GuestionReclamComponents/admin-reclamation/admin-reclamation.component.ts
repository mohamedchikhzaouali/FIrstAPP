import { Component, OnInit } from '@angular/core';
import { ReclamationService } from 'src/app/services/ReclamServices/reclamation.service';
import { ChartConfiguration, ChartType, ChartData } from 'chart.js';

@Component({
  selector: 'app-admin-reclamation',
  templateUrl: './admin-reclamation.component.html',
  styleUrls: ['./admin-reclamation.component.scss']
})
export class AdminReclamationComponent implements OnInit {

  reclamations: any[] = [];
  reclamationEnCours: any = null;
  searchTerm: string = '';
  userRolel: string | null = null;




  constructor(
    private reclamationService: ReclamationService,
  ) {}

  ngOnInit(): void {
    this.loadReclamations();
  }

  loadReclamations(): void {
    this.reclamationService.getReclamation().subscribe(
      (data) => {
        this.reclamations = data.reverse(); // Inverser l'ordre des réclamations
        // this.calculateStatistics(); // Calculer les statistiques après le chargement

      },
      (error) => {
        console.error('Error while retrieving claims', error);
      }
    );
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
        // this.calculateStatistics(); // Recalculer les statistiques après modification
      },
      (error) => {
        console.error("Error while updating the status", error);
      }
    );
  }

  // calculateStatistics(): void {
  //   const treatedCount = this.reclamations.filter(r => r.statut === 'traité').length;
  //   const untreatedCount = this.reclamations.filter(r => r.statut === ' ').length;

  //   this.barChartData = [treatedCount, untreatedCount];
  // }



  formatReclamationType(type: string): string {
    return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
  }

  filterReclamations(): any[] {
    return this.reclamations.filter(reclamation =>
      this.formatReclamationType(reclamation.objet).toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      reclamation.description.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  getPriorityClass(priority: string): string {
    switch (priority) {
      case 'HIGH':
        return 'bg-danger text-white'; // Red color for high priority
      case 'MEDIUM':
        return 'bg-warning text-dark'; // Yellow color for medium priority
      case 'LOW':
        return 'bg-success text-white'; // Green color for low priority
      default:
        return 'bg-secondary text-white'; // Gray color for unknown values
    }
  }

}
