import { Component } from '@angular/core';
import { ReclamationService } from 'src/app/services/ReclamServices/reclamation.service';
import { FormBuilder, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { AuthService } from 'src/app/AuthService';
import { Observable, Subscription } from 'rxjs';

// Import the ReclamationType enum
export enum ReclamationType {
  COURSE_CONTENT_ISSUES = 'COURSE_CONTENT_ISSUES',
  TECHNICAL_PROBLEMS = 'TECHNICAL_PROBLEMS',
  INSTRUCTOR_OR_SUPPORT_CLAIM = 'INSTRUCTOR_OR_SUPPORT_CLAIM',
  GRADING_AND_ASSESSMENT_DISPUTES = 'GRADING_AND_ASSESSMENT_DISPUTES',
  ACCOUNT_AND_PAYMENT_ISSUES = 'ACCOUNT_AND_PAYMENT_ISSUES',
  OTHER = 'OTHER'
}

@Component({
  selector: 'app-ajouter-reclamation',
  templateUrl: './ajouter-reclamation.component.html',
  styleUrls: ['./ajouter-reclamation.component.scss'],
})
export class AjouterReclamationComponent {
  userRole$: Observable<string | null>;
  recform: any;
  today: string;

  // Convert enum to an array of objects with readable labels
  reclamationTypes = Object.values(ReclamationType).map(value => ({
    key: value,
    label: value.replace(/_/g, ' ') // Format for display
  }));

  constructor(
    private recservice: ReclamationService,
    private fb: FormBuilder,
    private authService: AuthService
  ) {
    this.userRole$ = this.authService.userRole$;

    // Initialize the form
    this.recform = this.fb.group({
      objet: ['', Validators.required], // Use dropdown (enum)
      statut: ['non traité'],
      date: ['', Validators.required],
      description: ['', Validators.required], // Make description required
    });

    // Get today's date in YYYY-MM-DD format
    const todayDate = new Date();
    this.today = todayDate.toISOString().split('T')[0];
  }

  ngOnInit(): void {
    this.userRole$.subscribe(role => {
      console.log('Rôle actuel (AppComponent):', role);
    });
  }

  onSubmit() {
    const formData = this.recform.value;

    // Submit the form via the service
    this.recservice.ajouterreclamation(formData).subscribe(
      (response) => {
        Swal.fire({
          title: "Good Job!",
          text: "Claim added successfully!",
          icon: "success"
        });
        console.log(response);
        // Reset the form after successful submission
        this.recform.reset();
      },
      (error) => {
        Swal.fire({
          title: "Error!",
          text: "An error occurred while adding the claim!",
          icon: "error"
        });
        console.error(error);
      }
    );
  }
}
