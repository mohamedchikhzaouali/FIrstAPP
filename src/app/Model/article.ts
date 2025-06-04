import { Ressource } from './ressource';
import { Tag } from './tag';

export interface Article {
  id?: number;
  title: string;
  date: Date | string;
  picture?: string;
  status: boolean;
  views: number;
  numberShares: number;
  categorie: 'NEWS' | 'SUCCESS_STORY' | 'BLOG';
  published: boolean;
  scheduled: boolean;
  scheduledDate?: string;
  user?: {
    id: number;
  };
  ressources?: Ressource[];
  tags?: Tag[]; // Add tags property
  publicationStatus?: 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' |'PENDING_APPROVAL'| 'ARCHIVED';
}