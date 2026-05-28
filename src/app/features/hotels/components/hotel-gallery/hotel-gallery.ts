import { Component, computed, input, signal } from '@angular/core';
import { hotelGalleryPhotos } from '../../../../shared/assets/placeholder-images';
import { PhotoLightbox } from '../../../../shared/ui/photo-lightbox/photo-lightbox';

/**
 * 1 large + 4 small mosaic. All 5 photos are placeholder Unsplash images
 * picked deterministically from `HOTEL_PHOTO_IDS` by hotelId.
 * Cell click opens the shared `PhotoLightbox` at that index.
 *
 * // TODO(backend): replace with real `hotel.galleryPhotoUrls[]` once exposed.
 */
@Component({
  selector: 'app-hotel-gallery',
  imports: [PhotoLightbox],
  templateUrl: './hotel-gallery.html',
  styleUrl: './hotel-gallery.scss',
})
export class HotelGallery {
  readonly hotelId = input.required<number>();

  protected readonly cells = computed(() => {
    const photos = hotelGalleryPhotos(this.hotelId(), 5);
    return photos.map((url, i) => ({
      id: `${this.hotelId()}-${i}`,
      thumbUrl: url,
      fullUrl: url,
    }));
  });

  /** Full-size images list fed into the shared lightbox. */
  protected readonly lightboxImages = computed(() => this.cells().map((c) => c.fullUrl));

  /** `null` when lightbox is closed; an index when open at that photo. */
  protected readonly openIndex = signal<number | null>(null);

  protected open(index: number): void {
    this.openIndex.set(index);
  }

  protected onClosed(): void {
    this.openIndex.set(null);
  }
}
