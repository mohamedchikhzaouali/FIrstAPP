import { DragAndDropPair } from "./dragAndDropPair";
import { Response } from "./response";
export interface Question {
    idQuestion: number;
    question: string;
    quizId: number;
    file?: File;
    questionPictureUrl?: string;
    responses?: Response[];
    dragAndDropPairs?: DragAndDropPair[]; //*************
    type: string;
  }  