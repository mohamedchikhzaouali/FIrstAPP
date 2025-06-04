import { Attachment } from "./Attachment";
import { CourseCategory } from "./Coursecategory";
import { Review } from "./Review";

export interface Course {
    idCourse: number;
    title: string;
    description: string;
    date: Date;
    picture: string;
    level: string;
    status: boolean;  //Disponiblw ou Indisponible
    price: number;
    liked: boolean;
    published?: boolean;  // Ajout de l'attribut
    scheduledPublishDate: Date;  // Ajout du champ scheduledPublishDate
    category: CourseCategory;
    attachments?: Attachment[]; // Optionnel pour éviter des erreurs si non fourni
    reviews?: Review[];
    averageRating:Float32Array;
    averageRatingnumber:number;
  }