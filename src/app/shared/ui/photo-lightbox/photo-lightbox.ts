import { DOCUMENT } from '@angular/common';
import {
  Component,
  computed,
  effect,
  HostListener,
  inject,
  input,
  output,
  signal,
} from '@angular/core';

/**
 * Fullscreen photo viewer used by hotel + room galleries.
 *
 * Parent owns the open/closed state by setting `openAtIndex`:
 *  - `null`  → lightbox hidden
 *  - number  → lightbox opens at that index in `images`
 *
 * On close (Esc, backdrop click, close button) the component emits `closed`
 * and the parent should reset `openAtIndex` back to `null`.
 */
@Component({
  selector: 'app-photo-lightbox',
  templateUrl: './photo-lightbox.html',
  styleUrl: './photo-lightbox.scss',
})
export class PhotoLightbox {
  private readonly doc = inject(DOCUMENT);

  readonly images = input.required<readonly string[]>();
  readonly openAtIndex = input<number | null>(null);
  readonly altPrefix = input('Photo');
  readonly closed = output<void>();

  /** Internal cursor — seeded by `openAtIndex` then navigates freely via prev/next. */
  private readonly internalIndex = signal(0);

  protected readonly isOpen = computed(
    () => this.openAtIndex() !== null && this.images().length > 0,
  );

  protected readonly currentImage = computed(
    () => this.images()[this.internalIndex()] ?? '',
  );

  protected readonly counterLabel = computed(
    () => `${this.internalIndex() + 1} / ${this.images().length}`,
  );

  constructor() {
    // Sync internal cursor when parent (re)opens at a specific index.
    effect(() => {
      const at = this.openAtIndex();
      if (at !== null && Number.isFinite(at)) {
        const safe = Math.max(0, Math.min(at, this.images().length - 1));
        this.internalIndex.set(safe);
      }
    });

    // Lock body scroll while the overlay is open.
    effect(() => {
      this.doc.body.style.overflow = this.isOpen() ? 'hidden' : '';
    });
  }

  protected close(): void {
    this.closed.emit();
  }

  protected prev(event?: Event): void {
    event?.stopPropagation();
    const total = this.images().length;
    if (total > 0) this.internalIndex.update((i) => (i - 1 + total) % total);
  }

  protected next(event?: Event): void {
    event?.stopPropagation();
    const total = this.images().length;
    if (total > 0) this.internalIndex.update((i) => (i + 1) % total);
  }

  @HostListener('document:keydown', ['$event'])
  protected onKeyDown(event: KeyboardEvent): void {
    if (!this.isOpen()) return;
    switch (event.key) {
      case 'Escape':
        this.close();
        break;
      case 'ArrowLeft':
        this.prev();
        break;
      case 'ArrowRight':
        this.next();
        break;
    }
  }
}
