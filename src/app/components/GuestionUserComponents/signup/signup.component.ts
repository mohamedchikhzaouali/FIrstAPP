import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from 'src/app/services/UserServices/user.service';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss']
})
export class SignupComponent implements OnInit {
  isToggled = false;
  formSignUp!: FormGroup;
  verificationCode: string = ''; // Add verification code input
  message: string = '';
  isVerified: boolean = false;

  constructor(private userService: UserService, private router: Router) { }

  ngOnInit(): void {
    this.formSignUp = new FormGroup({
      cin: new FormControl(null, [Validators.pattern('^[0-9]{8}$')]),
      name: new FormControl('', [Validators.required, Validators.pattern('^[a-zA-Z]+$')]),
      surname: new FormControl('', [Validators.required, Validators.pattern('^[a-zA-Z]+$')]),
      birthDate: new FormControl(null, [Validators.required, this.minAgeValidator(10)]),
      picture: new FormControl<File | null>(null),
      phoneNumber: new FormControl('', [Validators.required, Validators.pattern('^[0-9]{8}$')]),
      address: new FormControl('', Validators.required),
      diploma: new FormControl(null, [this.fileValidator(['pdf'])]),
      cv: new FormControl(null, [this.fileValidator(['pdf'])]),
      level: new FormControl(''),
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [Validators.required, Validators.minLength(6)]),
      confirmPassword: new FormControl('', [Validators.required, this.passwordMatchValidator.bind(this)])
    });
    this.updateValidators();
  }

  // Custom validator for minimum age
minAgeValidator(minAge: number) {
  return (control: FormControl): {[key: string]: any} | null => {
    if (!control.value) {
      return null; // Don't validate if no date is entered (handled by Validators.required)
    }

    const birthDate = new Date(control.value);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();

    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    if (age < minAge) {
      return {'minAge': {'requiredAge': minAge, 'actualAge': age}};
    }
    return null;
  };
}

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    if (this.formSignUp && this.formSignUp.get('password')?.value !== control.value) {
      return { passwordMismatch: true };
    }
    return null;
  }

  toggle() {
    this.isToggled = !this.isToggled;
    this.updateValidators();
  }

  updateValidators() {
    if (this.isToggled) {
      this.formSignUp.get('cin')?.setValidators([Validators.required, Validators.pattern('^[0-9]{8}$')]);
      this.formSignUp.get('diploma')?.setValidators([Validators.required, this.fileValidator(['pdf'])]);
      this.formSignUp.get('cv')?.setValidators([Validators.required, this.fileValidator(['pdf'])]);
      this.formSignUp.get('level')?.clearValidators();
    } else {
      this.formSignUp.get('level')?.setValidators([Validators.required]);
      this.formSignUp.get('cin')?.clearValidators();
      this.formSignUp.get('diploma')?.clearValidators();
      this.formSignUp.get('cv')?.clearValidators();
    }
    this.formSignUp.get('cin')?.updateValueAndValidity();
    this.formSignUp.get('diploma')?.updateValueAndValidity();
    this.formSignUp.get('cv')?.updateValueAndValidity();
    this.formSignUp.get('level')?.updateValueAndValidity();
    this.formSignUp.get('picture')?.updateValueAndValidity();
  }

  birthDateValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    const birthDate = new Date(control.value);
    const age = new Date().getFullYear() - birthDate.getFullYear();
    const month = new Date().getMonth() - birthDate.getMonth();

    if (age > 85 || (age === 85 && month > 0)) {
      return { invalidAge: true };
    }
    return null;
  }

  fileValidator(allowedExtensions: string[]) {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value || !(control.value instanceof File)) return null;

      const file = control.value;
      const extension = file.name.split('.').pop()?.toLowerCase();

      if (extension && !allowedExtensions.includes(extension)) {
        return { invalidFileType: true };
      }
      return null;
    };
  }

  onFileChange(event: any, controlName: string) {
    const fileInput = event.target;
    if (fileInput.files && fileInput.files.length > 0) {
      const file: File = fileInput.files[0];
      console.log('File selected:', file);  // Log the selected file
      this.formSignUp.get(controlName)?.setValue(file);
      this.formSignUp.get(controlName)?.markAsTouched();
      this.formSignUp.get(controlName)?.markAsDirty();
      this.formSignUp.get(controlName)?.updateValueAndValidity();
    } else {
      console.log('No file selected');
      this.formSignUp.get(controlName)?.setValue(null);
      this.formSignUp.get(controlName)?.markAsTouched();
      this.formSignUp.get(controlName)?.markAsDirty();
      this.formSignUp.get(controlName)?.updateValueAndValidity();
    }
  }

  sendVerificationCode() {
    const emailValue = this.formSignUp.get('email')?.value;
    console.log('Email value:', emailValue);
    console.log("formSignUp:", this.formSignUp)

    if (emailValue) {
      this.userService.sendVerificationEmail(emailValue).subscribe(
        (response) => {
          this.message = response.message;
        },
        (error) => {
          this.message = error.error.message;
        }
      );
    } else {
      this.message = 'Email is empty.';
    }
  }

  verifyCode() {
    const emailValue = this.formSignUp.get('email')?.value;
    if (emailValue) {
      this.userService.verifyEmail(emailValue, this.verificationCode).subscribe(
        (response) => {
          this.message = response.message;
          this.isVerified = true;
        },
        (error) => {
          this.message = error.error.message;
        }
      );
    } else {
      this.message = "Email is empty.";
    }

  }

  onSubmit() {
    this.isVerified = false;
    this.formSignUp.markAllAsTouched();
    console.log("Form errors:", this.formSignUp.errors);
    console.log("Form controls:", this.formSignUp.controls);
  
    if (this.formSignUp.invalid) {
      console.log("Form is invalid, preventing submission.");
      return;
    }
  
    const formData = new FormData();
    Object.keys(this.formSignUp.controls).forEach(key => {
      const controlValue = this.formSignUp.get(key)?.value;
      console.log(`${key} value:`, controlValue);  // Log the value
  
      // For picture, diploma, and cv, check if no file is selected and only append if a file is chosen
      if (key === 'picture' || key === 'diploma' || key === 'cv') {
        if (controlValue && controlValue instanceof File) {
          formData.append(key, controlValue);
        }
        // Do not append anything if no file is selected
      } else {
        // Append the value of the field or empty string if the value is null or undefined
        formData.append(key, controlValue || '');
      }
    });
  
    // Append role (Teacher/Student)
    const role = this.isToggled ? 'Teacher' : 'Student';
    console.log('Selected role:', role);
    formData.append('role', role.toUpperCase());
  
    console.log('FormData:', formData);  // Log FormData for debugging
  
    this.userService.signup(formData).subscribe({
      next: (response) => {
        console.log('Signup successful', response);
        this.router.navigate(['/login']); // Redirect to login page after successful signup
      },
      error: (error) => {
        console.error('Signup failed', error);
        this.message = error.error.message;
      }
    });
  }
  
}
