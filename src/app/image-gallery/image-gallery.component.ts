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
    ImageUploadComponent
  ],
  templateUrl: './image-gallery.component.html',
  styleUrls: ['./image-gallery.component.css']
})
export class ImageGalleryComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('scrollAnchor') scrollAnchor!: ElementRef<HTMLElement>;

  images: any[] = [];
  nextCursor: string | null = null;
  hasMore = true;
  isLoading = false;
  searchQuery = '';
  private scrollSubscription!: Subscription;
  private resizeSubscription!: Subscription;
  private scrollPositionBeforeLoad = 0;
  private loadingElement: HTMLElement | null = null;

  constructor(private api: ApiService) { }

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
      rootMargin: '200px 0px', // Trigger load when within 200px of viewport bottom
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
    const isNearBottom = rect.top <= window.innerHeight + 200; // Load when within 200px of viewport bottom

    if (isNearBottom) {
      this.loadMoreImages();
    }
  }

  loadMoreImages() {
    if (!this.hasMore || this.isLoading) return;

    // Store current scroll position
    this.scrollPositionBeforeLoad = window.scrollY + window.innerHeight;

    this.isLoading = true;
    this.api.getImages(this.nextCursor, 12, this.searchQuery).subscribe({
      next: (res) => {
        const newImages = res.data.images.map((img: any) => ({ ...img, loaded: false }));
        this.images = [...this.images, ...newImages];
        this.nextCursor = res.data.pagination.next_cursor;
        this.hasMore = res.data.pagination.has_more;
      },
      error: (err) => {
        console.error('Error loading images:', err);
        this.isLoading = false;
      },
      complete: () => {

        setTimeout(() => {
          window.scrollTo({
            top: this.scrollPositionBeforeLoad - window.innerHeight,
            behavior: 'auto'
          });
          this.isLoading = false;
        }, 1000);
      }
    });
  }

  loadImages() {
    this.images = [];
    this.nextCursor = null;
    this.hasMore = true;
    this.loadMoreImages();
  }

  getImageUrl(fileId: string): string {
    return this.api.getImageUrl(fileId);
  }

  onSearch() {
    this.loadImages();
  }

  showUploadModal = false;

  openUploadModal() {
    this.showUploadModal = true;
  }

  closeUploadModal() {
    this.showUploadModal = false;
  }

  onUploadComplete() {
    this.closeUploadModal();
    this.loadImages();
  }
}
