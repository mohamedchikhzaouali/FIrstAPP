import { Article } from './article';

export interface ReadLater {
  id: number;
  userId?: number;
  articleId?: number;
  user?: any;
  article?: Article;
  createdAt?: string;
  reminderDate: string;
  notified: boolean;
}
