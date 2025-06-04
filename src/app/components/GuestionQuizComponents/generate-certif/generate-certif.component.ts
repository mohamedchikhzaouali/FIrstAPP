import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { StudentQuizService } from 'src/app/services/QuizServices/student-quiz-service.service'; 
import { jsPDF } from 'jspdf';
import { Person } from 'src/app/Model/UserModel/user';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { UserService } from 'src/app/services/UserServices/user.service';


@Component({
  selector: 'app-generate-certif',
  templateUrl: './generate-certif.component.html',
  styleUrls: ['./generate-certif.component.scss']
})
export class GenerateCertifComponent implements OnInit {
  name: any = null;
  surname: any = null;
  email: any = null;

  constructor(
    private route: ActivatedRoute,
    private studentQuizService: StudentQuizService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.loadStudentInfo();
  }

  // Créer une fonction qui retourne l'observable de load Student_Quiz Info
    loadStudentInfo(): Observable<Person | null> {
      return this.userService.getUserInfo().pipe(
        map((user: any) => { // Type the user data as 'any' initially or your Person model
          this.name = user.name;
          this.surname = user.surname;
          this.email = user.email;
          return user as Person; // Cast the result to your Person model
        }),
        catchError(error => {
          console.error("Erreur lors de la récupération des informations de l'utilisateur connecté :", error);
          return of(null);
        })
      );
    }

  /*loadStudentData(): void {
    this.studentQuizService.getStudentByCin(this.studentId!).subscribe((student) => {
      this.studentName = student.name;
      this.studentSurname = student.surname;
    });
  }*/

  generateCertificate(): void {
    if (!this.name || !this.surname) {
      alert('Nom ou prénom de l\'étudiant manquant!');
      return;  // Assurez-vous que le nom et le prénom sont disponibles avant de générer le certificat.
    }

    const doc = new jsPDF();
    
    // Ajouter l'image de fond
    doc.addImage('/assets/certificate-background.jpg', 'JPEG', 0, 0, 210, 297);

    // Ajouter le texte (nom et prénom de l'utilisateur)
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(24);
    doc.text(`Certificate of Completion`, 105, 50, { align: 'center' });
    
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(20);
    doc.text(`Name: ${this.name} ${this.surname}`, 105, 100, { align: 'center' });

    // Ajouter un bouton pour télécharger le PDF
    doc.save(`${this.name}_${this.surname}_Certificate.pdf`);
  }
}
