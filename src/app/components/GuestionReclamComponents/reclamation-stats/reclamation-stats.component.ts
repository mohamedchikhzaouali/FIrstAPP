import { Component, OnInit } from '@angular/core';
import { ReclamationService } from 'src/app/services/ReclamServices/reclamation.service';
import { ChartConfiguration, ChartType, ChartData } from 'chart.js';

@Component({
  selector: 'app-reclamation-stats',
  templateUrl: './reclamation-stats.component.html',
  styleUrls: ['./reclamation-stats.component.scss']
})
export class ReclamationStatsComponent implements OnInit {

  // Pie Chart for Status
  public pieChartLabels: string[] = ['Traité', 'Non traité'];
  public pieChartData: ChartData<'pie'> = {
    labels: this.pieChartLabels,
    datasets: [{ data: [0, 0], backgroundColor: ['#28a745', '#dc3545'] }]
  };
  public pieChartType: ChartType = 'pie';

  // Bar Chart for Priority
  public priorityChartLabels: string[] = ['High', 'Medium', 'Low'];
  public priorityChartData: ChartData<'bar'> = {
    labels: this.priorityChartLabels,
    datasets: [{ label: 'Priority Distribution', data: [0, 0, 0], backgroundColor: ['#ff4d4d', '#ffcc00', '#00cc66'] }]
  };
  public priorityChartType: ChartType = 'bar';

  // Doughnut Chart for Types
  public typeChartLabels: string[] = [];
  public typeChartData: ChartData<'doughnut'> = {
    labels: this.typeChartLabels,
    datasets: [{ data: [], backgroundColor: ['#007bff', '#6610f2', '#17a2b8', '#ffc107', '#dc3545', '#28a745'] }]
  };
  public typeChartType: ChartType = 'doughnut';

  constructor(private reclamationService: ReclamationService) {}

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    this.reclamationService.reclamationStats().subscribe(
      (data) => {
        this.updatePieChart(data.traité, data["non traité"]);
        this.updatePriorityChart(data.HIGH, data.MEDIUM, data.LOW);
        this.updateTypeChart(data.types);
      },
      (error) => {
        console.error('Error retrieving stats', error);
      }
    );
  }

  updatePieChart(treated: number, untreated: number): void {
    this.pieChartData.datasets[0].data = [treated, untreated];
  }

  updatePriorityChart(high: number, medium: number, low: number): void {
    this.priorityChartData.datasets[0].data = [high, medium, low];
  }

  updateTypeChart(types: { [key: string]: number }): void {
    this.typeChartLabels = Object.keys(types);
    this.typeChartData.datasets[0].data = Object.values(types);
  }

  formatReclamationType(type: string): string {
    return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
  }
}
