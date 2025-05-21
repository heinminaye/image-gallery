import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { saveAs } from 'file-saver';
import { ApiService } from '../shared/services/api.service'; // Import your API service

@Component({
  selector: 'app-image-dialog',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  templateUrl: './image-dialog.component.html',
})
export class ImageDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: {
      imageUrl: string;
      fileId: string;
      title?: string;
      description?: string;
    },
    private dialogRef: MatDialogRef<ImageDialogComponent>,
    private api: ApiService
  ) {}

  onClose(): void {
    this.dialogRef.close();
  }

  downloadImage(): void {
    this.api.downloadImage(this.data.fileId).subscribe(blob => {
      saveAs(blob, this.data.title || `image_${this.data.fileId.slice(0, 8)}`);
    });
  }
}
