import { Component, computed, input, signal } from '@angular/core';
import { HOTEL_PHOTO_IDS, unsplashUrl } from '../../../../shared/assets/placeholder-images';
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

  /**
   * Start at offset (hotelId + 1) % 6 so the gallery doesn't repeat the hero photo
   * (hero uses `HOTEL_PHOTO_IDS[hotelId % 6]`).
   */
  protected readonly cells = computed(() => {
    const start = (Math.abs(this.hotelId()) + 1) % HOTEL_PHOTO_IDS.length;
    return Array.from({ length: 5 }, (_, i) => {
      const id = HOTEL_PHOTO_IDS[(start + i) % HOTEL_PHOTO_IDS.length];
      return {
        id,
        thumbUrl: unsplashUrl(id, i === 0 ? 1400 : 900, 82),
        fullUrl: unsplashUrl(id, 2000, 86),
      };
    });
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
