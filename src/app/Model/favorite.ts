import { Article } from './article';

export interface Favorite {
    id?: number;
    
    user?: {
        id: number;
        // Add other user properties if needed
    };
    
    articles?: Article[];  // Ensure articles is treated as an optional array of Article objects
}
