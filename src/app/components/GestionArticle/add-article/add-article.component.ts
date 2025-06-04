import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Article } from 'src/app/Model/article';
import { Ressource } from 'src/app/Model/ressource';
import { Tag } from 'src/app/Model/tag';
import { ArticleServiceService } from 'src/app/services/ArticleService/article-service.service';
import { SimilarArticlesService } from 'src/app/services/ArticleService/similar-articles.service';
export interface FormErrors {
  [key: string]: string;
  title: string;
  date: string;
  picture: string;
  categorie: string;
  resource: string;
  resourceDescription: string;
  resourceUrl: string;
  scheduledDate: string;
  publicationStatus: string;
  tags: string;
}

// Add these interfaces to provide proper typing
interface ResourceData {
  description?: string;
  video?: string;
  pdf?: string;
  picture?: string;
  [key: string]: any; // Allow for additional properties
}

interface ResourceFiles {
  [key: string]: File;
}

@Component({
  selector: 'app-add-article',
  templateUrl: './add-article.component.html',
  styleUrls: ['./add-article.component.scss']
})
export class AddArticleComponent implements OnInit {
  minScheduledDate: string;
  availableTags: Tag[] = [];
  selectedTags: string[] = [];
  newTagInput: string = '';
  suggestedTags: string[] = []; // For content-based tag suggestions

  // Add predefined tags property
  predefinedTags: string[] = [
    'Technology',
    'Health',
    'Education',
    'Business',
    'Science',
    'Entertainment',
    'Sports'
  ];

  article: Article = {
    title: '',
    date: new Date().toISOString().split('T')[0],
    categorie: 'NEWS',
    status: false,
    views: 0,
    numberShares: 0,
    ressources: [],
    user: { id: 1 },
    published: false,
    scheduled: false,
    publicationStatus: 'DRAFT', // Default to Draft
    scheduledDate: undefined, // Initialize as undefined
    tags: [] // Initialize empty tags array
  };

  newResource: Ressource = {
    description: '',
    video: '',
    pdf: '',
    picture: ''
  };

  formErrors: FormErrors = {
    title: '',
    date: '',
    picture: '',
    categorie: '',
    resource: '',
    resourceDescription: '',
    resourceUrl: '',
    scheduledDate: '',
    publicationStatus: '',
    tags: ''
  };

  error: string | null = null;

  // Add properties for file uploads
  selectedPictureFile: File | null = null;
  picturePreview: string | null = null;
 
  selectedVideoFile: File | null = null;
  selectedPdfFile: File | null = null;
  selectedResourcePictureFile: File | null = null;
  resourcePicturePreview: string | null = null;

  // Save temporarily uploaded files for resources
  resourceFiles: { [key: number]: { video?: File, pdf?: File, picture?: File } } = {};

  constructor(
    private articleService: ArticleServiceService,
    private similarArticlesService: SimilarArticlesService,
    private router: Router
  ) {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 1);
    this.minScheduledDate = now.toISOString().slice(0, 16);
  }

  ngOnInit(): void {
    this.updateScheduledAvailability();
    this.loadAvailableTags();
    this.ensurePredefinedTagsExist();
  }

  loadAvailableTags(): void {
    this.similarArticlesService.getAllTags().subscribe({
      next: (tags) => {
        this.availableTags = tags;
      },
      error: (error) => {
        console.error('Error loading tags:', error);
      }
    });
  }

  addTag(): void {
    if (this.newTagInput.trim()) {
      if (!this.selectedTags.includes(this.newTagInput.trim())) {
        this.selectedTags.push(this.newTagInput.trim());
      }
      this.newTagInput = '';
    }
  }

  removeTag(tag: string): void {
    this.selectedTags = this.selectedTags.filter(t => t !== tag);
  }

  onTagSelected(): void {
    if (this.newTagInput) {
      this.addTag();
    }
  }

  selectSuggestedTag(tag: string): void {
    if (!this.selectedTags.includes(tag)) {
      this.selectedTags.push(tag);
    }
  }

  // Add this method to select a predefined tag
  selectPredefinedTag(tagName: string): void {
    if (!this.selectedTags.includes(tagName)) {
      this.selectedTags.push(tagName);
    }
  }

  addResource(): void {
    if (!this.newResource.description && !this.newResource.video &&
      !this.newResource.pdf && !this.newResource.picture) {
      alert('Please fill at least one field for the resource');
      return;
    }

    if (this.newResource.description.length > 500) {
      alert('Description must be less than 500 characters');
      return;
    }

    if (!this.article.ressources) {
      this.article.ressources = [];
    }

    const resourceIndex = this.article.ressources.length;
   
    // Store files for this resource
    this.resourceFiles[resourceIndex] = {};
    if (this.selectedVideoFile) {
      this.resourceFiles[resourceIndex].video = this.selectedVideoFile;
    }
    if (this.selectedPdfFile) {
      this.resourceFiles[resourceIndex].pdf = this.selectedPdfFile;
    }
    if (this.selectedResourcePictureFile) {
      this.resourceFiles[resourceIndex].picture = this.selectedResourcePictureFile;
    }

    const resourceToAdd: Ressource = {
      description: this.newResource.description || '',
      video: this.newResource.video || '',
      pdf: this.newResource.pdf || '',
      picture: this.newResource.picture || '',
      article: null
    };

    this.article.ressources.push(resourceToAdd);
    console.log('Added resource:', resourceToAdd);

    // Reset form and previews
    this.newResource = {
      description: '',
      video: '',
      pdf: '',
      picture: ''
    };
    this.selectedVideoFile = null;
    this.selectedPdfFile = null;
    this.selectedResourcePictureFile = null;
    this.resourcePicturePreview = null;
  }

  private ensureValidUrl(url: string | undefined): string | undefined {
    if (!url || url.trim() === '') return undefined;

    try {
      const urlObject = new URL(url);
      return urlObject.toString();
    } catch {
      return url.startsWith('http://') || url.startsWith('https://')
        ? url
        : `https://${url}`;
    }
  }

  removeResource(index: number): void {
    if (this.article.ressources) {
      this.article.ressources.splice(index, 1);
      // Also remove stored files
      delete this.resourceFiles[index];
      // Reindex to avoid gaps
      const newResourceFiles: typeof this.resourceFiles = {};
      Object.keys(this.resourceFiles).forEach((key, i) => {
        const numKey = parseInt(key);
        if (numKey > index) {
          newResourceFiles[numKey - 1] = this.resourceFiles[numKey];
        } else if (numKey < index) {
          newResourceFiles[numKey] = this.resourceFiles[numKey];
        }
      });
      this.resourceFiles = newResourceFiles;
      console.log('Resources after removal:', this.article.ressources);
    }
  }

  updateScheduledAvailability(): void {
    if (this.article.publicationStatus === 'DRAFT') {
      this.article.scheduled = false; // Uncheck scheduled if status is Draft
    }
  }

  validateForm(): boolean {
    let isValid = true;
    this.formErrors = {
      title: '',
      date: '',
      picture: '',
      categorie: '',
      resource: '',
      resourceDescription: '',
      resourceUrl: '',
      scheduledDate: '',
      publicationStatus: '',
      tags: ''
    };

    if (!this.article.title || this.article.title.trim().length === 0) {
      this.formErrors.title = 'Title is required';
      isValid = false;
    }

    if (!this.article.picture || this.article.picture.trim().length === 0) {
      this.formErrors.picture = 'Picture URL is required';
      isValid = false;
    }

    if (!this.article.categorie) {
      this.formErrors.categorie = 'Category is required';
      isValid = false;
    }

    if (!this.article.ressources || this.article.ressources.length === 0) {
      this.formErrors.resource = 'At least one resource is required';
      isValid = false;
    } else {
      for (const resource of this.article.ressources) {
        if (!resource.description && !resource.video && !resource.pdf && !resource.picture) {
          this.formErrors.resourceDescription = 'At least one field must be filled in for each resource';
          isValid = false;
          break;
        }
      }
    }

    if (this.article.scheduled && !this.article.scheduledDate) {
      this.formErrors.scheduledDate = 'La date de publication est requise';
      isValid = false;
    }

    return isValid;
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  onSubmit(): void {
    // First add any pending resource
    if (this.newResource.description || this.newResource.video ||
      this.newResource.pdf || this.newResource.picture) {
      this.addResource();
    }

    if (this.validateForm()) {
      // Create the array of tag objects
      const tagObjects = this.selectedTags.map(name => ({ name }));
      console.log('Preparing tags for submission:', tagObjects);

      const articleToSubmit = {
        ...this.article,
        date: this.article.date,
        status: this.article.status,
        views: 0,
        numberShares: 0,
        user: { id: 1 },
        publicationStatus: this.article.publicationStatus,
        scheduledDate: this.article.scheduledDate,
        tags: tagObjects // Make sure tags are included in the submission
      };

      console.log('Submitting article with tags:', articleToSubmit);

      // Prepare resources data and files for multipart upload
      const resourcesData: ResourceData[] = [];
      const resourcesFiles: ResourceFiles = {};

      // Process resources if they exist
      if (this.article.ressources && this.article.ressources.length > 0) {
        this.article.ressources.forEach((resource, index) => {
          // Add resource data
          resourcesData.push({
            description: resource.description || '',
            video: resource.video || '',
            pdf: resource.pdf || '',
            picture: resource.picture || ''
          });

          // Add resource files if they exist in the resourceFiles array
          if (this.resourceFiles[index]?.picture) {
            resourcesFiles[`resource_${index}_picture`] = this.resourceFiles[index].picture!;
          }

          if (this.resourceFiles[index]?.video) {
            resourcesFiles[`resource_${index}_video`] = this.resourceFiles[index].video!;
          }

          if (this.resourceFiles[index]?.pdf) {
            resourcesFiles[`resource_${index}_pdf`] = this.resourceFiles[index].pdf!;
          }
        });
      }

      // Submit using the updated service method with files
      this.articleService.createArticle(
        articleToSubmit,
        this.selectedPictureFile || undefined,
        { files: resourcesFiles, data: resourcesData }
      ).subscribe({
        next: (response) => {
          console.log('Article created successfully:', response);
         
          // If the article was created but tags weren't applied, add them separately
          if (response.id && this.selectedTags.length > 0 && (!response.tags || response.tags.length === 0)) {
            console.log('Tags were not applied during creation, adding them separately');
            this.addTagsToArticle(response.id, this.selectedTags);
          } else {
            this.router.navigate(['/articles']);
          }
        },
        error: (error) => {
          console.error('Error creating article:', error);
          alert('Erreur lors de la création de l\'article: ' +
            (error.error?.message || error.message || 'Erreur inconnue'));
        }
      });
    } else {
      alert('Veuillez remplir tous les champs obligatoires');
    }
  }

  // Add a helper method to add tags to an existing article as a fallback
  addTagsToArticle(articleId: number, tagNames: string[]): void {
    this.similarArticlesService.addTagsToArticle(articleId, tagNames).subscribe({
      next: (updatedArticle) => {
        console.log('Tags added separately to article:', updatedArticle);
        this.router.navigate(['/articles']);
      },
      error: (error) => {
        console.error('Error adding tags separately:', error);
        // Still navigate to articles list since the article was created
        this.router.navigate(['/articles']);
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/articles']);
  }

  // Method to ensure predefined tags exist in the database
  ensurePredefinedTagsExist(): void {
    for (const tagName of this.predefinedTags) {
      // Check if the tag already exists in available tags
      if (!this.availableTags.some(tag => tag.name.toLowerCase() === tagName.toLowerCase())) {
        // If not, create it
        this.similarArticlesService.createTag(tagName).subscribe({
          next: (createdTag) => {
            console.log(`Created predefined tag: ${tagName}`);
            // Add the newly created tag to available tags
            this.availableTags.push(createdTag);
          },
          error: (error) => {
            console.error(`Error creating predefined tag ${tagName}:`, error);
            // If creation fails, it might be because the tag already exists
            // We'll refresh the tags list to make sure
            this.loadAvailableTags();
          }
        });
      }
    }
  }

  // File handling methods
  onPictureFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedPictureFile = input.files[0];
      this.article.picture = this.selectedPictureFile.name; // Just for display
     
      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        this.picturePreview = reader.result as string;
      };
      reader.readAsDataURL(this.selectedPictureFile);
    }
  }

  removePictureFile(): void {
    this.selectedPictureFile = null;
    this.picturePreview = null;
    this.article.picture = '';
  }

  onVideoFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedVideoFile = input.files[0];
      this.newResource.video = this.selectedVideoFile.name; // Just for display
    }
  }

  removeVideoFile(): void {
    this.selectedVideoFile = null;
    this.newResource.video = '';
  }

  onPdfFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedPdfFile = input.files[0];
      this.newResource.pdf = this.selectedPdfFile.name; // Just for display
    }
  }

  removePdfFile(): void {
    this.selectedPdfFile = null;
    this.newResource.pdf = '';
  }

  onResourcePictureFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedResourcePictureFile = input.files[0];
      this.newResource.picture = this.selectedResourcePictureFile.name; // Just for display
     
      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        this.resourcePicturePreview = reader.result as string;
      };
      reader.readAsDataURL(this.selectedResourcePictureFile);
    }
  }

  removeResourcePictureFile(): void {
    this.selectedResourcePictureFile = null;
    this.resourcePicturePreview = null;
    this.newResource.picture = '';
  }

  // Utility methods
  getFilenameFromPath(path: string | undefined): string {
    if (!path) return 'No file selected';
    return path.split('/').pop() || path;
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}