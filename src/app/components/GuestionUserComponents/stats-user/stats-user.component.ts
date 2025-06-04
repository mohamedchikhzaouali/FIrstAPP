import { Component, OnInit, ElementRef, ViewChild, OnDestroy, AfterViewInit } from '@angular/core';
import { UserService } from 'src/app/services/UserServices/user.service';
import { Chart, PieController, ArcElement, BarController, CategoryScale, LinearScale, BarElement, ChartOptions } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels'; // Importez le plugin comme objet par défaut

@Component({
  selector: 'app-stats-user',
  templateUrl: './stats-user.component.html',
  styleUrls: ['./stats-user.component.scss']
})
export class StatUserComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('pieChartCanvasRole') pieChartCanvasRole!: ElementRef;
  pieChart!: Chart<'pie', number[], string>; // Définissez le type correctement
  @ViewChild('barChartCanvasNewUsers') barChartCanvasNewUsers!: ElementRef;
  barChartNewUsers!: Chart<'bar', number[], string>; // Définissez le type correctement
  @ViewChild('pieChartCanvasStatus') pieChartCanvasStatus!: ElementRef;
  pieChartStatus!: Chart<'pie', number[], string>; // Définissez le type correctement

  totalUsers: number = 0;
  bannedUsers: number = 0;
  activeUsers: number = 0;
  newUsersToday: number = 0;
  usersWithBlockedStatus: number = 0;
  activeUsersChange: number | null = null;
  activeUsersPreviousMonth: number | null = null;

  constructor(private userService: UserService) { }

  ngOnInit(): void {
    Chart.register(PieController, ArcElement, BarController, CategoryScale, LinearScale, BarElement, ChartDataLabels); // Enregistrez le plugin ici
    this.userService.getTotalUsers().subscribe(data => this.totalUsers = data, error => console.error('Error fetching total users:', error));
    this.userService.getbanned().subscribe(data => this.bannedUsers = data, error => console.error('Error fetching banned users:', error));
    this.userService.getActiveUsersLastMonth().subscribe(data => {
      this.activeUsers = data;
      this.calculateActiveUsersChange();
    }, error => console.error('Error fetching active users:', error));
    this.userService.getNewUsersToday().subscribe(data => this.newUsersToday = data, error => console.error('Error fetching new users today:', error));
    this.userService.getUsersByStatus().subscribe(data => {
      console.log('Data from getUsersByStatus:', data); // Add this line
      this.usersWithBlockedStatus = data['PENDING'] || 0;
      const statuses = Object.keys(data);
      const counts = Object.values(data);
      this.renderStatusPieChart(statuses, counts);
    }, error => console.error('Error fetching users by status:', error));
    // Chart.register(pluginDataLabels); // Supprimez cette ligne, l'enregistrement est déjà fait dans Chart.register(...)
  }

  ngAfterViewInit(): void {
    this.userService.getUsersByRole().subscribe(
      (data) => {
        const roles = Object.keys(data);
        const counts = Object.values(data);
        this.renderPieChart(roles, counts);
        this.renderBarChart(roles, counts); // Use this data for the bar chart as well
      },
      (error) => {
        console.error('Error fetching users by role:', error);
      }
    );
  }

  ngOnDestroy(): void {
    if (this.pieChart) {
      this.pieChart.destroy();
    }
    if (this.barChartNewUsers) {
      this.barChartNewUsers.destroy();
    }
    if (this.pieChartStatus) {
      this.pieChartStatus.destroy();
    }
  }

  renderStatusPieChart(labels: string[], data: number[]): void {
    const ctx = this.pieChartCanvasStatus.nativeElement.getContext('2d');
    this.pieChartStatus = new Chart<'pie', number[], string>(ctx, { // Spécifiez le type ici aussi
      type: 'pie',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: [
            'rgba(255, 206, 86, 0.8)', // Yellow for Pending
            'rgba(54, 162, 235, 0.8)'  // Blue for Approved
            // Remove any extra colors here
          ],
          borderColor: [
            'rgba(255, 206, 86, 1)',
            'rgba(54, 162, 235, 1)'
            // Remove any extra border colors
          ],
          borderWidth: 1,
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'top',
          },
          datalabels: {
            formatter: (value: any, ctx: any) => {
              if (ctx.chart.data && ctx.chart.data.labels) {
                const label = ctx.chart.data.labels[ctx.dataIndex];
                return `${label}: ${value}`; // Show label and count on the slice
              }
              return '';
            },
          },
        } as any
      }
    });
  }

  renderPieChart(labels: string[], data: number[]): void {
    const ctx = this.pieChartCanvasRole.nativeElement.getContext('2d');
    this.pieChart = new Chart<'pie', number[], string>(ctx, { // Spécifiez le type ici aussi
      type: 'pie',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: [
            'rgba(255, 99, 132, 0.8)',
            'rgba(54, 162, 235, 0.8)',
            'rgba(255, 206, 86, 0.8)',
            'rgba(75, 192, 192, 0.8)',
            'rgba(153, 102, 255, 0.8)',
            'rgba(255, 159, 64, 0.8)'
          ],
          borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)',
            'rgba(255, 159, 64, 1)'
          ],
          borderWidth: 1,
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'top',
          },
          datalabels: {
            formatter: (value: any, ctx: any) => {
              if (ctx.chart.data && ctx.chart.data.labels) {
                const label = ctx.chart.data.labels[ctx.dataIndex];
                return label;
              }
              return '';
            },
          },
        } as any
      }
    });
  }

  renderBarChart(labels: string[], data: number[]): void {
    const ctx = this.barChartCanvasNewUsers.nativeElement.getContext('2d');
    this.barChartNewUsers = new Chart<'bar', number[], string>(ctx, { // Spécifiez le type ici aussi
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'New Users',
          data: data,
          backgroundColor: 'rgba(54, 162, 235, 0.8)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true
          }
        },
        plugins: {
          datalabels: {
            anchor: 'end',
            align: 'end',
            formatter: (value: any, ctx: any) => {
              return value;
            }
          }
        }
      }
    });
  }

  calculateActiveUsersChange(): void {
    if (this.activeUsers !== null && this.activeUsersPreviousMonth !== null) {
      if (this.activeUsersPreviousMonth === 0) {
        this.activeUsersChange = this.activeUsers > 0 ? Infinity : 0;
      } else {
        this.activeUsersChange =
          ((this.activeUsers - this.activeUsersPreviousMonth) / this.activeUsersPreviousMonth) * 100;
      }
    }
  }
}