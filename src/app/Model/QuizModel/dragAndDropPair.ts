import { Question } from "./question";


export interface DragAndDropPair {
  
    idDragAndDrop: number;
    sourceText: string;
    targetText: string;
    questionId: number;
    questionList?: Question[];
  }  