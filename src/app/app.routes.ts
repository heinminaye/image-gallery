import { Routes } from '@angular/router';
import { ImageUploadComponent } from './image-upload/image-upload.component';
import { ImageGalleryComponent } from './image-gallery/image-gallery.component';

export const routes: Routes = [
  { path: 'upload', component: ImageUploadComponent },
  { path: 'gallery', component: ImageGalleryComponent },
  { path: '', redirectTo: '/gallery', pathMatch: 'full' },
  { path: '**', redirectTo: '/gallery' }
];
