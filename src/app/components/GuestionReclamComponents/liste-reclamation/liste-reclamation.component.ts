import { Component, OnInit } from '@angular/core';
import { ReclamationService } from 'src/app/services/ReclamServices/reclamation.service';
import { Router } from '@angular/router';
import jsPDF from 'jspdf'; // Import jsPDF
import { AuthService } from 'src/app/AuthService';
import { Observable, Subscription } from 'rxjs';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

interface ReclamationType {
  key: string;
  label: string;
}

@Component({
  selector: 'app-liste-reclamations',
  templateUrl: './liste-reclamation.component.html',
  styleUrls: ['./liste-reclamation.component.scss']
})
export class ListeReclamationsComponent implements OnInit {
  userRole$: Observable<string | null>;
  reclamationsOrigine: any[] = []; // Store the original list for filtering
  reclamations: any[] = [];        // Store the filtered/displayed list
  reclamationEnCoursForm: FormGroup;
  reclamationEnCours: any = null;
  objet: string = ''; // For search filter binding
  userRolel: string | null = null; // Still unused
  isTreated: string = "traité";
  reclamationTypes: ReclamationType[] = [
    { key: 'COURSE_CONTENT_ISSUES', label: 'Course Content Issues' },
    { key: 'TECHNICAL_PROBLEMS', label: 'Technical Problems' },
    { key: 'INSTRUCTOR_OR_SUPPORT_CLAIM', label: 'Instructor Or Support Claim' },
    { key: 'GRADING_AND_ASSESSMENT_DISPUTES', label: 'Grading And Assessment Disputes' },
    { key: 'ACCOUNT_AND_PAYMENT_ISSUES', label: 'Account And Payment Issues' },
    { key: 'OTHER', label: 'Other' }
  ];

  // Bar chart properties (if used)
  public barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: { y: { beginAtZero: true } },
  };
  public barChartLabels = ['Traité', 'Non traité'];
  public barChartData: number[] = [0, 0];

  constructor(
    private reclamationService: ReclamationService,
    private router: Router,
    private authService: AuthService,
    private fb: FormBuilder // Inject FormBuilder
  ) {
    this.userRole$ = this.authService.userRole$;
    this.reclamationEnCoursForm = this.fb.group({
      id: [''],
      objet: ['', Validators.required],
      description: ['', Validators.required],
      date: ['', Validators.required]
    });
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
        this.reclamationsOrigine = data.reverse();
        this.reclamations = [...this.reclamationsOrigine];
        this.calculateStatistics();
        this.filterReclamations();
      },
      (error) => {
        console.error('Erreur lors de la récupération des réclamations:', error);
        this.reclamationsOrigine = [];
        this.reclamations = [];
      }
    );
  }

  filterReclamations(): void {
    const filterValue = this.objet.trim().toLowerCase();
    if (filterValue) {
      this.reclamations = this.reclamationsOrigine.filter(
        (reclamation) =>
          this.formatReclamationType(reclamation.objet).toLowerCase().includes(filterValue) ||
          reclamation.description.toLowerCase().includes(filterValue)
      );
    } else {
      this.reclamations = [...this.reclamationsOrigine];
    }
  }


  supprimerReclamation(id: number): void {
    if (confirm("Are you sure you want to delete this claim?")) {
      this.reclamationService.supprimerReclamation(id).subscribe(
        () => {
          console.log("Claim deleted successfully");
          this.reclamationsOrigine = this.reclamationsOrigine.filter(r => r.id !== id);
          this.filterReclamations();
          this.calculateStatistics();
        },
        (error) => {
          console.error("Error while deleting the claim:", error);
        }
      );
    }
  }

  calculateStatistics(): void {
    const treatedCount = this.reclamationsOrigine.filter(r => r.statut === 'traité').length;
    const untreatedCount = this.reclamationsOrigine.filter(r => r.statut === 'non traité').length;
    this.barChartData = [treatedCount, untreatedCount];
  }

  goToAddReclamation() {
    this.router.navigate(['/add-claim']); // Corrected route
  }

  modifierReclamation(reclamation: any): void {
    this.reclamationEnCours = { ...reclamation };
    this.reclamationEnCoursForm.patchValue({
      id: reclamation.id,
      objet: reclamation.objet,
      description: reclamation.description,
      date: this.formatDate(reclamation.date)
    });
  }

  formatDate(dateInput: string | Date): string {
    const date = new Date(dateInput);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  updateReclamation(): void {
    if (this.reclamationEnCoursForm.valid) {
      const updatedReclamation = this.reclamationEnCoursForm.value;
      this.reclamationService.modifierReclamation(updatedReclamation).subscribe(
        (updatedReclamationFromServer) => {
          console.log("Claim updated successfully");
          const index = this.reclamationsOrigine.findIndex(r => r.id === updatedReclamationFromServer.id);
          if (index !== -1) {
            this.reclamationsOrigine[index] = updatedReclamationFromServer;
          } else {
            this.loadReclamations(); // Fallback
          }
          this.filterReclamations();
          this.calculateStatistics();
          this.reclamationEnCours = null;
          this.reclamationEnCoursForm.reset();
        },
        (error) => {
          console.error("Error while updating the claim:", error);
        }
      );
    }
  }

  formatReclamationType(type: string): string {
    if (!type) return '';
    return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
  }

  // --- UPDATED METHOD: Download Claim Details as PDF (prettier, no status, BRAINWAVE signature) ---
  downloadReclamation(reclamation: any): void {
    const doc = new jsPDF('p', 'mm', 'a4'); // A4 page size, portrait, units in mm
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    let currentY = 20; // Start position with margin
    const margin = 15;
    const contentWidth = pageWidth - 2 * margin;

    // --- Document Header ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22); // Slightly larger header
    doc.setTextColor(51, 51, 51); // Darker gray
    doc.text('CLAIM DETAILS', pageWidth / 2, currentY, { align: 'center' });
    currentY += 12;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(16); // Slightly larger platform name
    doc.setTextColor(63, 114, 175); // A professional blue
    doc.text('BRAINWAVE Platform', pageWidth / 2, currentY, { align: 'center' });
    currentY += 18;

    // --- Separator Line ---
    doc.setDrawColor(220, 220, 220); // Light gray line
    doc.setLineWidth(0.8); // Slightly thicker line
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 15;

    // --- Claim Information Section ---
    doc.setFontSize(14);
    doc.setTextColor(51, 51, 51); // Darker gray for labels
    const labelX = margin;
    const valueX = margin + 55; // More indentation for values

    const addDetail = (label: string, value: string) => {
      if (currentY > pageHeight - 40) { // More space at the bottom
        doc.addPage();
        currentY = 20;
      }
      doc.setFont('helvetica', 'bold');
      doc.text(label, labelX, currentY);
      doc.setFont('helvetica', 'normal');
      const valueLines = doc.splitTextToSize(value, contentWidth - (valueX - margin));
      doc.text(valueLines, valueX, currentY);
      currentY += (valueLines.length * 6) + 5; // Adjust spacing
    };

    addDetail('Claim ID:', String(reclamation.id));
    addDetail('Claim Type:', this.formatReclamationType(reclamation.objet));
    const formattedDate = new Date(reclamation.date).toLocaleDateString(undefined, {
      year: 'numeric', month: 'long', day: 'numeric'
    });
    addDetail('Date Filed:', formattedDate);

    currentY += 10; // More space before description

    // --- Description Section ---
    doc.setFont('helvetica', 'bold');
    doc.text('Description:', margin, currentY);
    currentY += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    const descriptionLines = doc.splitTextToSize(reclamation.description || 'N/A', contentWidth);
    if (currentY + (descriptionLines.length * 6) > pageHeight - 70) { // More space for "signature"
      doc.addPage();
      currentY = 20;
    }
    doc.text(descriptionLines, margin, currentY);
    currentY += descriptionLines.length * 6 + 15; // More space after description

    // --- "Signature" Area (Now BRAINWAVE Platform) ---
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(14);
    doc.setTextColor(63, 114, 175); // Professional blue
    doc.text('BRAINWAVE Platform', pageWidth / 2, currentY + 10, { align: 'center' });
    currentY += 20; // Space after platform name

    // --- Footer ---
    const footerY = pageHeight - 15;
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.8);
    doc.line(margin, footerY - 8, pageWidth - margin, footerY - 8);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(119, 119, 119); // Medium gray
    const downloadTimestamp = new Date().toLocaleString();
    doc.text(`Generated on: ${downloadTimestamp}`, pageWidth / 2, footerY, { align: 'center' });

    // --- Save the PDF ---
    const filenameDate = this.formatDate(reclamation.date);
    const filename = `BRAINWAVE_Claim_${reclamation.id}_${filenameDate}.pdf`;
    doc.save(filename);
  }

  annulerModification(): void {
    this.reclamationEnCours = null;
    this.reclamationEnCoursForm.reset();
  }
}