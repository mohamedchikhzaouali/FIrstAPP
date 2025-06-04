// src/app/Model/CourseModel/course-summary.dto.ts ou similaire
export interface CourseSummaryDto {
    idCourse: number;
    title: string;
    picture?: string;
    price?: number;
    averageRating: number;
    // Ajoutez d'autres champs si besoin
    // category?: string;
  }