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
import { MatDialogRef } from '@angular/material/dialog';

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
  isDragging = false;

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private snackBar: MatSnackBar,
    private dialogRef: MatDialogRef<ImageUploadComponent>,
  ) {
    this.uploadForm = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      width: [''],
      height: ['']
    });
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.handleFileSelection(event.dataTransfer.files[0]);
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFileSelection(input.files[0]);
    }
  }

  private handleFileSelection(file: File) {
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
        if (res.returncode === '200') {
          this.snackBar.open(res.message, 'Close', { duration: 3000 });
          this.dialogRef.close('uploaded');
        } else {
          this.snackBar.open('Upload failed: ' + res.message, 'Close', { duration: 5000 });
          this.isUploading = false;
          this.uploadProgress = 0;
        }
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

  onClose(): void {
    this.dialogRef.close();
  }
}
