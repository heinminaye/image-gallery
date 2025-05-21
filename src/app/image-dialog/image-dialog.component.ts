import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-image-dialog',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  template: `
    <div class="dialog-container">
      <!-- Header with close button -->
      <div class="dialog-header">
        <h2 class="dialog-title">{{ data.title || 'Image Preview' }}</h2>
        <button mat-icon-button class="close-button" (click)="onClose()">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <!-- Image content -->
      <div class="dialog-content">
        <img [src]="data.imageUrl" class="dialog-image" alt="Preview">
        <p *ngIf="data.description" class="image-description">{{ data.description }}</p>
      </div>

      <!-- Footer with download button -->
      <div class="dialog-footer">
        <button mat-raised-button color="primary" (click)="downloadImage()">
          <mat-icon>download</mat-icon>
          Download
        </button>
      </div>
    </div>
  `,
  styles: [`
    .dialog-container {
      display: flex;
      flex-direction: column;
      max-height: 90vh;
      width: 90vw;
      max-width: 1000px;
    }

    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 24px;
      border-bottom: 1px solid #e0e0e0;
    }

    .dialog-title {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 500;
    }

    .close-button {
      margin-left: auto;
    }

    .dialog-content {
      padding: 24px;
      overflow-y: auto;
      flex-grow: 1;
    }

    .dialog-image {
      max-width: 100%;
      max-height: calc(90vh - 200px);
      display: block;
      margin: 0 auto;
      object-fit: contain;
    }

    .image-description {
      margin-top: 16px;
      color: #616161;
      line-height: 1.5;
    }

    .dialog-footer {
      padding: 16px 24px;
      border-top: 1px solid #e0e0e0;
      display: flex;
      justify-content: flex-end;
    }
  `]
})
export class ImageDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<ImageDialogComponent>
  ) {}

  onClose(): void {
    this.dialogRef.close();
  }

  downloadImage(): void {
    const link = document.createElement('a');
    link.href = this.data.imageUrl;
    link.download = this.data.title || 'image';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
