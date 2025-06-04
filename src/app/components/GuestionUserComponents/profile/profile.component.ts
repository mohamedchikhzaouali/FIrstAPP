import { Component, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { UserService } from 'src/app/services/UserServices/user.service';
import * as faceapi from 'face-api.js';

import { AuthService } from 'src/app/AuthService';
import { Observable, Subscription } from 'rxjs';
import { DatePipe } from '@angular/common';
import { StudentQuizService } from 'src/app/services/QuizServices/student-quiz-service.service';
import { jsPDF } from 'jspdf';


@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
  providers: [DatePipe]
})
export class ProfileComponent {
  userRole$: Observable<string | null>;

  userEmail: string | null = null;
  userProfile: any = null;
  profileImageUrl: string | ArrayBuffer | null = '';
  user: any;
  isModalOpen = false;
  isPasswordModalOpen = false;
  isConfirmationModalOpen = false;
  errorMessage: string | null = null;

  selectedFile: File | null = null; // NEW: Property to hold the selected file
  backendErrorMessage: string | null = null; // Nouvelle propriété pour les messages d'erreur du backend

  // NEW: Properties for successful quizzes modal
  isSuccessfulQuizzesModalOpen = false;
  successfulQuizzes: any[] = [];
  successfulQuizzesError: string | null = null;

  constructor(
    private userService: UserService,
    private datePipe: DatePipe,
    private authService: AuthService,
    private studentQuizService: StudentQuizService
  ) {
    this.userRole$ = this.authService.userRole$;
  }

  isFaceRegistrationModalOpen = false;
  @ViewChild('videoElement') videoElementRef!: ElementRef;
  @ViewChild('canvasElement') canvasElementRef!: ElementRef;
  video: HTMLVideoElement | null = null;
  canvas: HTMLCanvasElement | null = null;
  stream: MediaStream | null = null;
  isRegisteringFace = false;
  registrationMessage = '';
  registrationError = '';


  userupdate = {
    name: '',
    surname: '',
    phoneNumber: '',
    address: ''
  };

  passwordData = {
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

  ngOnInit(): void {
    this.userRole$.subscribe(role => {
      console.log('Rôle actuel (AppComponent):', role);
    });

    this.userService.getUserInfo().subscribe(
      (data) => {
        this.user = data;
        if (this.user.birthDate) {
          this.user.birthDate = this.datePipe.transform(this.user.birthDate, 'yyyy-MM-dd');
        }
        this.loadFaceAPIModels();
      },
      (error) => {
        console.error('Error fetching user data:', error);
      }
    );
  }

  // NEW: Method to handle file selection
  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    } else {
      this.selectedFile = null;
    }
  }

  async loadFaceAPIModels() {
    try {
        await faceapi.nets.tinyFaceDetector.loadFromUri('/assets/models/tiny_face_detector');
        await faceapi.nets.faceLandmark68Net.loadFromUri('/assets/models/face_landmark_68');
        await faceapi.nets.faceRecognitionNet.loadFromUri('/assets/models/face_recognition');
        console.log('Face API models loaded successfully in ProfileComponent.');
    } catch (error) {
        console.error('Error loading Face API models in ProfileComponent:', error);
        this.registrationError = 'Failed to load face recognition models.';
    }
}

openFaceRegistrationModal() {
  this.isFaceRegistrationModalOpen = true;
  setTimeout(() => {
      this.setupWebcam().then(() => {
          if (this.video) {
              this.detectFacesContinuously();
          }
      });
  }, 0);
}

closeFaceRegistrationModal() {
    this.isFaceRegistrationModalOpen = false;
    this.stopWebcam();
    this.registrationMessage = '';
    this.registrationError = '';
}



async setupWebcam() {
  try {
      this.video = this.videoElementRef.nativeElement;
      console.log('Video element:', this.video);
      if (!this.video) {
          console.error('Video element is null.');
          this.registrationError = 'Error accessing video element.';
          return;
      }
      this.stream = await navigator.mediaDevices.getUserMedia({ video: true });
      console.log('Webcam stream:', this.stream);
      this.video.srcObject = this.stream;
  } catch (error) {
      console.error('Error accessing webcam:', error);
      this.registrationError = 'Error accessing webcam. Please ensure you have a camera and have granted permission.';
  }
}

stopWebcam() {
  if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.video!.srcObject = null;
      this.stream = null;
  }
}

async detectFacesContinuously() {
  console.log('detectFacesContinuously() is running');
  if (!this.video || !this.canvas) {
      return;
  }
  const displaySize = { width: this.video.width, height: this.video.height };
  this.canvas.width = displaySize.width;
  this.canvas.height = displaySize.height;
  const ctx = this.canvas.getContext('2d');
  if (ctx) {
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      try {
          const detection = await faceapi.detectSingleFace(this.video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptor();
          if (detection) {
              const resizedDetections = faceapi.resizeResults(detection, displaySize);
              faceapi.draw.drawDetections(this.canvas, resizedDetections);
          }
      } catch (error) {
          console.error('Error during continuous face detection:', error);
      }
  }
  requestAnimationFrame(this.detectFacesContinuously.bind(this));
}

async captureAndRegisterFace() {
  console.log('captureAndRegisterFace() called');
  console.log('Video element ref in capture:', this.videoElementRef);
    this.video = this.videoElementRef.nativeElement;
    this.canvas = this.canvasElementRef.nativeElement;
    console.log('Video element in capture:', this.video);
    console.log('Canvas element in capture:', this.canvas);

    if (!this.video || !this.canvas || !this.user) {
        console.log('Video, canvas, or user is null');
        return;
    }

  this.isRegisteringFace = true;
  this.registrationMessage = 'Capturing and processing face...';
  this.registrationError = '';

  const displaySize = { width: this.video.width, height: this.video.height };
  this.canvas.width = displaySize.width;
  this.canvas.height = displaySize.height;
  const ctx = this.canvas.getContext('2d');
  console.log('Canvas context:', ctx);
  ctx?.drawImage(this.video, 0, 0, displaySize.width, displaySize.height);
  console.log('drawImage called');
  const imageDataURL = this.canvas.toDataURL('image/jpeg');
  console.log('Captured image data URL:', imageDataURL);
  try {
    const detection = await faceapi.detectSingleFace(this.canvas, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptor();
    console.log('Face detection result:', detection);
    if (!detection) {
        this.registrationError = 'No face detected. Please try again.';
        this.isRegisteringFace = false;
        return;
    }

    const box = detection.detection.box;
    const drawBox = new faceapi.draw.DrawBox(box, { label: 'Detected Face' });
    drawBox.draw(this.canvas);

    const descriptor = detection.descriptor;
    console.log('Face descriptor captured:', descriptor);
    console.log('Calling userService.registerFace() with email:', this.user.email, 'and descriptor:', Array.from(descriptor));
    this.userService.registerFace(this.user.email, Array.from(descriptor)).subscribe(
        (response) => {
            this.registrationMessage = 'Face registered successfully!';
            this.isRegisteringFace = false;
            setTimeout(() => this.closeFaceRegistrationModal(), 2000);
        },
        (error) => {
            console.error('Error registering face:', error);
            this.registrationError = 'Failed to register face. Please try again.';
            this.isRegisteringFace = false;
        }
    );
    console.log('userService.registerFace() call initiated');

} catch (error) {
    console.error('Error during face detection or registration:', error);
    this.registrationError = 'An error occurred during face processing.';
    this.isRegisteringFace = false;
}
}

  openModal() {
    this.isModalOpen = true;
    this.selectedFile = null; // Clear selected file when opening modal
  }

  closeModal() {
    this.isModalOpen = false;
  }

  openPasswordModal() {
    this.isPasswordModalOpen = true;
    this.errorMessage = null;
  }

  closePasswordModal() {
    this.isPasswordModalOpen = false;
  }

  showConfirmationModal() {
    if (this.passwordData.newPassword !== this.passwordData.confirmPassword) {
      this.errorMessage = 'New password and confirmation do not match!';
      return;
    }

    this.isPasswordModalOpen = false;
    this.isConfirmationModalOpen = true;
    this.errorMessage = null;
  }

  closeConfirmationModal() {
    this.isConfirmationModalOpen = false;
  }

  // MODIFIED: updateProfile to send FormData
  updateProfile() {
    this.backendErrorMessage = null; // Réinitialiser le message avant chaque tentative
    const formData = new FormData();

    // Append existing user data
    // Ensure you only append fields that the backend expects as @RequestParam
    if (this.user.name) formData.append('name', this.user.name);
    if (this.user.surname) formData.append('surname', this.user.surname);
    if (this.user.phoneNumber) formData.append('phoneNumber', this.user.phoneNumber);
    if (this.user.address) formData.append('address', this.user.address);
    if (this.user.birthDate) {
      // Ensure date is sent in a format the backend expects (e.g., 'yyyy-MM-dd')
      formData.append('birthDate', this.datePipe.transform(this.user.birthDate, 'yyyy-MM-dd') || '');
    }

    // Append the selected file if available
    if (this.selectedFile) {
      formData.append('picture', this.selectedFile);
    }

    this.userService.updateUserProfile(formData).subscribe(
      (response) => {
        console.log('Profile updated successfully:', response);
        this.closeModal();
        window.location.reload();
      },
      (error) => {
        console.error('Error updating profile:', error);
        // Assurez-vous que votre backend renvoie un objet d'erreur avec une propriété 'error'
        if (error.error && error.error.error) {
          this.backendErrorMessage = error.error.error;
        } else {
          this.backendErrorMessage = 'Failed to update profile. Please try again.';
        }
      }
    );
  }

  submitPasswordUpdate() {
    const passwordUpdateRequest = {
      oldPassword: this.passwordData.oldPassword,
      newPassword: this.passwordData.newPassword
    };
    console.log('Old Password:', passwordUpdateRequest.oldPassword);

    // Call the new service method for password update
    this.userService.updatePassword(passwordUpdateRequest).subscribe(
      (response) => {
        console.log('Password updated successfully:', response);
        this.closePasswordModal();
        this.closeConfirmationModal();
        this.errorMessage = null;
        this.userService.logout();
      },
      (error) => {
        console.error('Error updating password:', error);
        this.errorMessage = 'Failed to update password. Please try again.';
      }
    );
  }

  // Methods for successful quizzes modal
  openSuccessfulQuizzesModal() {
    this.isSuccessfulQuizzesModalOpen = true;
    this.successfulQuizzesError = null;
    this.studentQuizService.getSuccessfulQuizzes().subscribe(
      (data: any[]) => { // Specify type as any[]
        // The 'data' array now contains the 'note' (score) for each successful quiz
        this.successfulQuizzes = data;
        if (this.successfulQuizzes.length === 0) {
          this.successfulQuizzesError = 'No quizzes passed yet.';
        }
      },
      (error) => {
        console.error('Error fetching successful quizzes:', error);
        this.successfulQuizzesError = 'Failed to load successful quizzes. Please try again later.';
      }
    );
  }

  closeSuccessfulQuizzesModal() {
    this.isSuccessfulQuizzesModalOpen = false;
    this.successfulQuizzes = [];
    this.successfulQuizzesError = null;
  }

  // Modified downloadCertificate method to accept quiz details and score
  downloadCertificate(quizTitle: string, score: number): void {
    const doc = new jsPDF();

    // Ajouter l'image de fond (optionnel)
    let imgWidth = 210; // Largeur maximale
    let imgHeight = (496 / 690) * imgWidth; // Ajustement proportionnel

    if (imgHeight > 297) {
        imgHeight = 297;
        imgWidth = (690 / 496) * imgHeight;
    }

    let x = (210 - imgWidth) / 2; // Centrage horizontal
    let y = (297 - imgHeight) / 2; // Centrage vertical

    // Ensure 'assets/certificate-background.png' exists in your Angular assets folder
    doc.addImage('assets/certificate-background.png', 'PNG', x, y, imgWidth, imgHeight);

    // Ajouter le texte sur le certificat
    doc.setFont("helvetica", "normal");
    doc.setFontSize(13);
    doc.text(`This is to certify that`, 60, 154, { align: "center" });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    // Use this.user.name and this.user.surname as they are available from the user object
    doc.text(`${this.user.name} ${this.user.surname}`, 70, 164, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(13);
    doc.text(`has successfully completed the quiz`, 100, 174, { align: "center" });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    // Use the passed quizTitle
    doc.text(`${quizTitle}`, 110, 182, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(14);
    // Use the passed score
    doc.text(`With a score of ${score}%`, 160, 190, { align: "center" });

    // Save the PDF
    // Use this.user.name and this.user.surname for the filename
    doc.save(`Certificat_${this.user.name}_${this.user.surname}_${quizTitle}.pdf`);
  }
}