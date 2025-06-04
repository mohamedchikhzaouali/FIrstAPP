export interface Person {
  idP: number;
  cin?: string; // String or null/undefined if optional
  name: string;
  surname: string;
  email: string;
  password?: string; // Never receive from API, but for typing purposes
  phoneNumber?: string;
  address?: string;
  birthDate?: Date; // Or string if you handle date strings
  picture?: string;
  cv?: string;
  diploma?: string;
  level?: string;
  banned: boolean;
  faceDescriptor?: number[]; // Or null if it can be null
  registrationDate?: Date; // Or string
  lastLogin?: Date; // Or string
  //  coursesTaught?: Course[];  //  Avoid circular references if possible
  //  reviewsWritten?: Review[]; // Avoid circular references if possible
  //  studentQuizList?: StudentQuiz[]; // Avoid if not strictly needed
}