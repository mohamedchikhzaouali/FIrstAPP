  import { AfterViewInit, Component, ElementRef, ViewChild, OnInit } from '@angular/core';
  import { FormGroup, FormControl, Validators } from '@angular/forms';
  import { Router } from '@angular/router';
  import { jwtDecode } from 'jwt-decode';
  import { UserService } from 'src/app/services/UserServices/user.service';
  import * as faceapi from 'face-api.js';


  declare global {
    interface Window {
      google: any;
    }
  }

  
  @Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss']
  })
  export class LoginComponent implements AfterViewInit, OnInit  {

    formLogin = new FormGroup({
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [Validators.required]),
    });

    show2FAModal: boolean = false;
    twoFACode: string = '';
    loginEmail: string = '';
    loginPassword: string = '';
    isVerifyButtonDisabled: boolean = false;
    remainingTime: number = 30; // Initial countdown time in seconds
    timerInterval: any;

    showPendingNotification: boolean = false;
    showBannedNotification: boolean = false;
    recaptchaToken: string = '';

    isForgotPassword = false;
    forgotPasswordError: string = '';
    forgotPasswordSuccess: boolean = false;
    isLoading: boolean = false;
    forgotPasswordForm = new FormGroup({
      email: new FormControl('', [Validators.required, Validators.email]),
    });

    isFaceLoginModalOpen = false;
    @ViewChild('loginVideoElement') loginVideoElementRef!: ElementRef;
    @ViewChild('loginCanvasElement') loginCanvasElementRef!: ElementRef;
    loginVideo: HTMLVideoElement | null = null;
    loginCanvas: HTMLCanvasElement | null = null;
    loginStream: MediaStream | null = null;
    isLoggingInWithFace = false;
    faceLoginMessage = '';
    faceLoginError = '';
    isWebcamInitialized = false;
    webcamSetupAttempted = false; // Add this flag

    constructor(private userService: UserService, private router: Router) { }

    
    ngOnInit(): void {
      
    }
    

   

    ngAfterViewInit(): void {
      this.loadFaceAPIModelsForLogin(); // Load models after the view is initialized
      this.initializeGoogleSignIn();

    }

    initializeGoogleSignIn() {
      if (window.google && window.google.accounts) {
        window.google.accounts.id.initialize({
          client_id: '728808317335-5km4brscvrbiioaevv4bjo2nkfhh3nob.apps.googleusercontent.com', // Replace with your actual Google Client ID
          callback: this.handleCredentialResponse.bind(this),
        });
  
        window.google.accounts.id.renderButton(
          document.getElementById('g_id_signin'),
          {
            theme: 'filled',
            text: 'signin_with',
            locale: 'en' }
            
        );
      } else {
        console.error('Google Identity Services library not loaded.');
        // Optionally, you could try to load the script again here if it fails initially
      }
    }
  
    handleCredentialResponse(response: any) {
      console.log('Encoded JWT ID token:', response.credential);
    this.userService.loginWithGoogle(response.credential).subscribe(
      (res: any) => {
        console.log('Google login successful', res);
        localStorage.setItem('token', res.token);
        localStorage.setItem('email', res.email);
        this.handleSuccessfulLogin(res.token);
      },
      (error) => {
        console.error('Google login failed', error);
        // Handle the error appropriately (e.g., show an error message)
      }
    );
    }
  
    

    async loadFaceAPIModelsForLogin() {
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri('/assets/models/tiny_face_detector');
        await faceapi.nets.faceLandmark68Net.loadFromUri('/assets/models/face_landmark_68');
        await faceapi.nets.faceRecognitionNet.loadFromUri('/assets/models/face_recognition');
        console.log('Face API models loaded successfully for login.');
      } catch (error) {
        console.error('Error loading Face API models for login:', error);
        this.faceLoginError = 'Failed to load face recognition models.';
      }
    }

    resolved(captchaResponse: string) {
      this.recaptchaToken = captchaResponse;
    }

    onLogin() {
      if (this.formLogin.valid && this.recaptchaToken) {
        const { email, password } = this.formLogin.value;

        if (email && password) {
          this.userService.login(email, password, this.recaptchaToken).subscribe(
            (response) => {
              if (response && response.message === '2FA code sent to your email. Please verify.') {
                this.show2FAModal = true;
                this.loginEmail = email;
                this.loginPassword = password;
                this.startTimer();
              } else {
                alert("Login failed. Please try again.");
              }
            },
            (error) => {
              console.error(error);
              if (error.status === 403 && error.error === "Your account is pending approval by the admin.") {
                this.showPendingNotification = true;
              } else if (error.status === 403 && error.error === "Your account has been banned. Please contact support.") {
                this.showBannedNotification = true;
              } else {
                alert('Login failed. Please check your credentials.');
              }
            }
          );
        } else {
          alert('Email and password are required');
        }
      }
    }

    startTimer() {
      this.remainingTime = 30; // Reset timer
      this.isVerifyButtonDisabled = true;
      this.timerInterval = setInterval(() => {
        this.remainingTime--;
        if (this.remainingTime <= 0) {
          this.stopTimer();
          this.isVerifyButtonDisabled = false;
        }
      }, 1000); // Update every 1 second
    }

    stopTimer() {
      clearInterval(this.timerInterval);
      this.isVerifyButtonDisabled = false;
    }

    verify2FA() {
      this.userService.verify2FA(this.loginEmail, this.twoFACode, this.loginPassword).subscribe({
        next: (response) => {
          const token = response?.token;
          if (token) {
            localStorage.setItem('jwt', token);
            const decodedToken: any = jwtDecode(token);
            const userEmail = decodedToken?.sub;
            const userRoles: string[] = decodedToken?.roles || [];

            if (userEmail) {
              localStorage.setItem('userEmail', userEmail);
            }
            this.userService.getUserInfo().subscribe(
              (userDetails: any) => {
                if (userDetails.status === 'PENDING') {
                  alert('Your account is still pending approval from the admin.');
                  localStorage.removeItem('jwt');
                  localStorage.removeItem('userEmail');
                  this.router.navigate(['/login']);
                } else if (userDetails.banned) {
                  alert('Your account has been banned.');
                  localStorage.removeItem('jwt');
                  localStorage.removeItem('userEmail');
                  this.router.navigate(['/login']);
                } else {
                  if (userRoles.includes('ROLE_ADMIN')) {
                    this.router.navigate(['/dashboard']);
                  } else {
                    this.router.navigate(['/home-login']);
                  }
                }
              },
              (userDetailsError) => {
                console.error('Error fetching user details:', userDetailsError);
                alert('Login failed. Please try again.');
                localStorage.removeItem('jwt');
                localStorage.removeItem('userEmail');
                this.router.navigate(['/login']);
              }
            );
          } else {
            alert('Invalid response from server');
          }
        },
        error: (error) => {
          alert('Invalid 2FA code.');
        }
      });
      this.show2FAModal = false;
      this.stopTimer();
    }

    close2FAModal() {
      this.show2FAModal = false;
    }

    closeNotification() {
      this.showPendingNotification = false;
      this.showBannedNotification = false;
    }

    showForgotPasswordForm() {
      this.isForgotPassword = true;
    }

    submitForgotPassword() {
      this.forgotPasswordError = '';
      this.isLoading = true;
      const email = this.forgotPasswordForm.value.email ?? '';

      this.userService.sendForgotPasswordEmail(email).subscribe(
        (response) => {
          this.forgotPasswordSuccess = true;
          this.isLoading = false;
        },
        (error) => {
          this.forgotPasswordError = 'Failed to send reset email. Please try again.';
          console.error(error);
          this.isLoading = false;
        }
      );
    }

    openFaceLoginModal() {
      this.isFaceLoginModalOpen = true;
      this.isWebcamInitialized = false; // Reset flag
      this.webcamSetupAttempted = false; // Reset flag
      setTimeout(() => {
        this.setupWebcamForLogin().then((success) => {
          this.webcamSetupAttempted = true; // Webcam setup attempted
          if (success && this.loginVideo) {
            this.detectFacesContinuouslyForLogin();
            this.isWebcamInitialized = true; // Enable button after successful setup
          } else {
            this.faceLoginError = 'Failed to initialize webcam.';
            this.isWebcamInitialized = false; // Ensure button remains disabled
          }
        });
      }, 0);
    }

    closeFaceLoginModal() {
      this.isFaceLoginModalOpen = false;
      this.stopWebcamForLogin();
      this.faceLoginMessage = '';
      this.faceLoginError = '';
      this.isWebcamInitialized = false;
      this.webcamSetupAttempted = false;
    }

    async setupWebcamForLogin(): Promise<boolean> {
      try {
        if (!this.loginVideoElementRef) return false;
        this.loginVideo = this.loginVideoElementRef.nativeElement;
        if (!this.loginVideo) {
          console.error('Login video element is null.');
          this.faceLoginError = 'Error accessing video element.';
          return false;
        }
        this.loginStream = await navigator.mediaDevices.getUserMedia({ video: true });
        this.loginVideo.srcObject = this.loginStream;
        return true;
      } catch (error) {
        console.error('Error accessing webcam for login:', error);
        this.faceLoginError = 'Error accessing webcam.';
        return false;
      }
    }

    stopWebcamForLogin() {
      if (this.loginStream) {
        this.loginStream.getTracks().forEach(track => track.stop());
        if (this.loginVideo) {
          this.loginVideo.srcObject = null;
        }
        this.loginStream = null;
      }
    }

    async detectFacesContinuouslyForLogin() {
      console.log('detectFacesContinuously() is running');
      if (!this.loginVideoElementRef || !this.loginCanvasElementRef || !this.loginVideoElementRef.nativeElement || !this.loginCanvasElementRef.nativeElement) {
        return;
      }
      const videoElement = this.loginVideoElementRef.nativeElement;
      const canvasElement = this.loginCanvasElementRef.nativeElement;
      const displaySize = { width: videoElement.width, height: videoElement.height };
      canvasElement.width = displaySize.width;
      canvasElement.height = displaySize.height;
      const ctx = canvasElement.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
        try {
          const detection = await faceapi.detectSingleFace(videoElement, new faceapi.TinyFaceDetectorOptions());
          if (detection) {
            const resizedDetections = faceapi.resizeResults(detection, displaySize);
            faceapi.draw.drawDetections(canvasElement, resizedDetections);
          }
        } catch (error) {
          console.error('Error during continuous face detection for login:', error);
        }
      }
      requestAnimationFrame(this.detectFacesContinuouslyForLogin.bind(this));
    }

    async loginWithFace() {
      console.log('loginwithface is called');
      console.log('Video element ref in capture:', this.loginVideoElementRef);
      this.isLoggingInWithFace = true;
      this.faceLoginMessage = 'Processing face...';
      this.faceLoginError = '';

      if (!this.loginVideoElementRef || !this.loginCanvasElementRef || !this.loginVideoElementRef.nativeElement || !this.loginCanvasElementRef.nativeElement) {
        this.faceLoginError = 'Video or canvas element not found.';
        this.isLoggingInWithFace = false;
        return;
      }

      const videoElement = this.loginVideoElementRef.nativeElement;
      const canvasElement = this.loginCanvasElementRef.nativeElement;

      // Wait for video metadata to load
      await new Promise((resolve) => {
        if (videoElement.readyState >= 2) { // HAVE_CURRENT_DATA or greater
          resolve(null);
        } else {
          videoElement.onloadedmetadata = () => {
            resolve(null);
          };
        }
      });

      const displaySize = { width: videoElement.videoWidth, height: videoElement.videoHeight };
      canvasElement.width = displaySize.width;
      canvasElement.height = displaySize.height;
      const ctx = canvasElement.getContext('2d');
      console.log('Canvas context:', ctx);
      ctx?.drawImage(videoElement, 0, 0, displaySize.width, displaySize.height);
      console.log('drawImage called');

      try {
        const detection = await faceapi.detectSingleFace(canvasElement, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptor();

        if (!detection) {
          this.faceLoginError = 'No face detected. Please try again.';
          this.isLoggingInWithFace = false;
          return;
        }

        const descriptor = detection.descriptor;
        console.log('Face descriptor for login:', descriptor);

        this.userService.loginWithFace(Array.from(descriptor)).subscribe({
          next: (response) => {
            if (response && response.token && response.email) { // Check for email in the response
              this.handleSuccessfulLogin(response.token); // Pass the email
              this.faceLoginMessage = 'Login successful!';
            } else {
              this.faceLoginError = 'Face not recognized. Please try again.';
            }
            this.isLoggingInWithFace = false;
            this.closeFaceLoginModal();
          },
          error: (error) => {
            console.error('Face login failed:', error);
            this.faceLoginError = 'Face not recognized. Please try again.';
            this.isLoggingInWithFace = false;
          }
        });

      } catch (error) {
        console.error('Error during face login:', error);
        this.faceLoginError = 'An error occurred during face login.';
        this.isLoggingInWithFace = false;
      }
    }

    handleSuccessfulLogin(token: string) {
      localStorage.setItem('jwt', token);
      const decodedToken: any = jwtDecode(token);
      const userEmail = decodedToken?.sub;
      const userRoles: string[] = decodedToken?.roles || [];

      if (userEmail) {
        localStorage.setItem('userEmail', userEmail);
      }
      this.userService.getUserInfo().subscribe(
        (userDetails: any) => {
          if (userDetails.status === 'PENDING') {
            alert('Your account is still pending approval from the admin.');
            localStorage.removeItem('jwt');
            localStorage.removeItem('userEmail');
            this.router.navigate(['/login']);
          } else if (userDetails.banned) {
            alert('Your account has been banned.');
            localStorage.removeItem('jwt');
            localStorage.removeItem('userEmail');
            this.router.navigate(['/login']);
          } else {
            if (userRoles.includes('ROLE_ADMIN')) {
              this.router.navigate(['/dashboard']);
            } else {
              this.router.navigate(['/home-login']);
            }
          }
        },
        (userDetailsError) => {
          console.error('Error fetching user details:', userDetailsError);
          alert('Login failed. Please try again.');
          localStorage.removeItem('jwt');
          localStorage.removeItem('userEmail');
          this.router.navigate(['/login']);
        }
      );
    }
  }