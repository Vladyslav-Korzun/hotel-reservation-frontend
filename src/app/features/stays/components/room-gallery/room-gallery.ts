import { Component, computed, input, signal } from '@angular/core';
import { PhotoLightbox } from '../../../../shared/ui/photo-lightbox/photo-lightbox';

@Component({
  selector: 'app-room-gallery',
  imports: [PhotoLightbox],
  templateUrl: './room-gallery.html',
  styleUrl: './room-gallery.scss',
})
export class RoomGallery {
  readonly mainSrc = input.required<string>();
  readonly thumbs = input<string[]>([]);

  /** All gallery images in order (main first, then thumbs), de-duplicated. */
  protected readonly images = computed(() =>
    Array.from(new Set([this.mainSrc(), ...this.thumbs()])),
  );

  /** `null` when lightbox is closed; an index when open at that photo. */
  protected readonly openIndex = signal<number | null>(null);

  protected open(index: number): void {
    this.openIndex.set(index);
  }

  protected onClosed(): void {
    this.openIndex.set(null);
  }
}
