import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { ApiService } from '../shared/services/api.service';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { FileSizePipe } from '../shared/pipes/filesize.pipe';
import { ImageUploadComponent } from '../image-upload/image-upload.component';
import { debounceTime, fromEvent, Subscription } from 'rxjs';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { ImageDialogComponent } from '../image-dialog/image-dialog.component';
import { saveAs } from 'file-saver';
@Component({
  selector: 'app-image-gallery',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    FileSizePipe,
    MatTooltipModule
  ],
  templateUrl: './image-gallery.component.html',
  styleUrls: ['./image-gallery.component.css'],
  animations: [
    trigger('fadeInGrow', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.9)' }),
        animate('300ms ease-out',
          style({ opacity: 1, transform: 'scale(1)' }))
      ])
    ]),
    trigger('listAnimation', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(20px)' }),
          stagger('100ms', [
            animate('300ms ease-out',
              style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ])
  ]
})
export class ImageGalleryComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('scrollAnchor') scrollAnchor!: ElementRef<HTMLElement>;

  images: any[] = [];
  nextCursor: string | null = null;
  hasMore = true;
  isLoading = false;
  isInitialLoad = true;
  searchQuery = '';
  private scrollSubscription!: Subscription;
  private resizeSubscription!: Subscription;
  private scrollPositionBeforeLoad = 0;


  constructor(
    private api: ApiService,
    private dialog: MatDialog
  ) { }

  ngOnInit() {
    this.loadImages();
  }

  ngAfterViewInit() {
    this.setupScrollObserver();

    this.scrollSubscription = fromEvent(window, 'scroll')
      .pipe(debounceTime(200))
      .subscribe(() => this.checkScrollPosition());

    this.resizeSubscription = fromEvent(window, 'resize')
      .pipe(debounceTime(200))
      .subscribe(() => this.checkScrollPosition());
  }

  ngOnDestroy() {
    this.scrollSubscription?.unsubscribe();
    this.resizeSubscription?.unsubscribe();
  }

  setupScrollObserver() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && this.hasMore && !this.isLoading) {
          this.loadMoreImages();
        }
      });
    }, {
      root: null,
      rootMargin: '300px 0px',
      threshold: 0.01
    });

    if (this.scrollAnchor) {
      observer.observe(this.scrollAnchor.nativeElement);
    }
  }

  checkScrollPosition() {
    if (!this.scrollAnchor || !this.hasMore || this.isLoading) return;

    const element = this.scrollAnchor.nativeElement;
    const rect = element.getBoundingClientRect();
    const isNearBottom = rect.top <= window.innerHeight + 300;

    if (isNearBottom) {
      this.loadMoreImages();
    }
  }

 loadMoreImages() {
  if (!this.hasMore || this.isLoading) return;

  this.scrollPositionBeforeLoad = window.scrollY;
  this.isLoading = true;

  this.api.getImages(this.nextCursor, 12, this.searchQuery).subscribe({
    next: (res) => {
      if (res.returncode === "200") {
        const newImages = res.data.images.map((img: any) => ({
          ...img,
          loaded: false,
          aspectRatio: img.width / img.height || 1,
          showFullDescription: false
        }));

        if (this.isInitialLoad) {
          this.images = newImages;
          this.isInitialLoad = false;
        } else {
          this.images = [...this.images, ...newImages];
        }

        this.nextCursor = res.data.pagination.next_cursor;
        this.hasMore = res.data.pagination.has_more;
      } else {
        console.warn('Unexpected return code:', res.message);
      }
    },
    error: (err) => {
      console.error('Error loading images:', err);
      this.isLoading = false;
    },
    complete: () => {
      setTimeout(() => {
        window.scrollTo({
          top: this.scrollPositionBeforeLoad,
          behavior: 'auto'
        });
        this.isLoading = false;
      }, 100);
    }
  });
}


  openUploadModal(): void {
    const dialogRef = this.dialog.open(ImageUploadComponent, {
      maxWidth: '1200px',
      panelClass: 'upload-modal-container',
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'uploaded') {
        this.loadImages();
      }
    });
  }

  openImageDialog(image: any): void {
    this.dialog.open(ImageDialogComponent, {
      maxWidth: '1200px',
      data: {
        imageUrl: this.getImageUrl(image.fileId),
        title: image.title,
        fileId: image.fileId,
        description: image.description
      },
      panelClass: 'image-dialog-container'
    });
  }

  // Download functionality
  downloadImage(image: any): void {
    this.api.downloadImage(image.fileId).subscribe(blob => {
      saveAs(blob, image.title || `image_${image.fileId.slice(0, 8)}`);
    });
  }

  loadImages() {
    this.images = [];
    this.nextCursor = null;
    this.hasMore = true;
    this.isInitialLoad = true;
    this.loadMoreImages();
  }

  getImageUrl(fileId: string): string {
    return this.api.getImageUrl(fileId);
  }

  onSearch() {
    this.loadImages();
  }

  showUploadModal = false;

  closeUploadModal() {
    this.showUploadModal = false;
  }

  onUploadComplete() {
    this.closeUploadModal();
    this.loadImages();
  }

  showFullDescription: boolean = false;

  toggleDescription(image: any): void {
    image.showFullDescription = !image.showFullDescription;
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.loadImages();
  }
  getImageTypeColor(contentType: string | undefined): string {
  const type = contentType?.split('/')[1]?.toLowerCase();

  switch(type) {
    case 'jpeg':
    case 'jpg':
      return 'bg-blue-100 text-blue-800';
    case 'png':
      return 'bg-green-100 text-green-800';
    case 'webp':
      return 'bg-purple-100 text-purple-800';
    default:
      return 'bg-gray-100 text-gray-600';
  }
}
}
