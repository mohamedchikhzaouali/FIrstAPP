import { Article } from './article';

export interface Ressource {
    id?: number;
    description: string;
    video: string;
    pdf: string;
    picture: string;
    article?: any;
} 