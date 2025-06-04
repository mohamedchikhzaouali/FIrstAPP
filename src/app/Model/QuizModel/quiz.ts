import { Question } from "./question";

export interface Quiz {
    idQuiz: number;
    titleQuiz: string;
    duration: string;
    startDate: Date;
    endDate: Date;
    price: number;
    type: string;
    questionList?: Question[];
    courseId: number | null;
  }  