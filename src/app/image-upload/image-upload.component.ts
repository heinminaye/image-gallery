import { Component, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../shared/services/api.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FileSizePipe } from '../shared/pipes/filesize.pipe';

@Component({
  selector: 'app-image-upload',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    FileSizePipe
  ],
  templateUrl: './image-upload.component.html',
  styleUrls: ['./image-upload.component.css']
})
export class ImageUploadComponent {
  @Output() uploadComplete = new EventEmitter<void>();
  uploadForm: FormGroup;
  selectedFile: File | null = null;
  isUploading = false;
  uploadProgress = 0;

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private snackBar: MatSnackBar
  ) {
    this.uploadForm = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      width: [''],
      height: ['']
    });
  }

  get safeSelectedFile(): File {
    return this.selectedFile!;
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        this.snackBar.open('Invalid file type. Please upload JPG, PNG, or WEBP.', 'Close', { duration: 5000 });
        return;
      }

      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        this.snackBar.open('File size exceeds 10MB limit.', 'Close', { duration: 5000 });
        return;
      }

      this.selectedFile = file;
    }
  }

  onSubmit() {
    if (this.uploadForm.invalid || !this.selectedFile) return;

    this.isUploading = true;
    this.uploadProgress = 0;

    const formData = new FormData();
    formData.append('image', this.selectedFile);
    formData.append('title', this.uploadForm.value.title);
    formData.append('description', this.uploadForm.value.description);
    if (this.uploadForm.value.width) formData.append('width', this.uploadForm.value.width);
    if (this.uploadForm.value.height) formData.append('height', this.uploadForm.value.height);

    this.api.uploadImage(formData).subscribe({
      next: (res) => {
        this.snackBar.open('Image uploaded successfully!', 'Close', { duration: 3000 });
        this.resetForm();
        this.uploadComplete.emit();
      },
      error: (err) => {
        this.snackBar.open('Upload failed: ' + err.message, 'Close', { duration: 5000 });
        this.isUploading = false;
        this.uploadProgress = 0;
      },
      complete: () => {
        this.isUploading = false;
        this.uploadProgress = 0;
      }
    });
  }

  private resetForm() {
    this.uploadForm.reset();
    this.selectedFile = null;
  }
}
