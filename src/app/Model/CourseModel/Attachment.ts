export interface Attachment {
  idAttachment: number;
  type: string;  // PDF, video, image
  source: string;
  chapterTitle: string;
  validated: boolean ;
  score: number;
  visible: boolean;
  courseId: number; // Association avec un cours
  filename: string;  // Si vous voulez l'utiliser dans le template
  timeSpentOnCourse?: number;
   validatedByCurrentUser?: boolean;
  timeSpentByCurrentUser?: number;

}