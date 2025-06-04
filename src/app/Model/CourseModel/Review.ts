// Dans src/app/Model/CourseModel/Review.ts
import { Course } from "./Course"; // Si vous avez besoin de l'objet Course complet

export interface AuthorInfo { // Interface pour les informations de l'auteur
    idP?: number;
    name?: string;
    surname?: string;
    picture?: string; // URL de l'image de profil de l'auteur
    // Ajoutez d'autres champs si nécessaire (ex: email si vous voulez l'afficher, mais attention à la vie privée)
}

export interface Review {
    idReview?: number;
    rating: number;
    comment: string;
    courseId?: number;
    sentiment?: string | null;
    reviewSummary?: string | null;
    analysisTimestamp?: string | Date | null;
    course?: Course; // Peut être utile si le backend le renvoie
    author?: AuthorInfo; // Informations sur l'auteur de l'avis
}