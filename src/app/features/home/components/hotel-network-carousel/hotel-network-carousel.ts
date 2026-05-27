import { Component, computed, effect, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProblemDetail } from '../../../../core/http/problem-detail.model';
import { hotelPhotoUrl } from '../../../../shared/assets/placeholder-images';
import { toTitleCase } from '../../../../shared/text/title-case.util';
import { ErrorMessage } from '../../../../shared/ui/error-message/error-message';
import { LoadingState } from '../../../../shared/ui/loading-state/loading-state';
import { Hotel } from '../../../hotels/model/hotel.model';

@Component({
  selector: 'app-hotel-network-carousel',
  imports: [RouterLink, ErrorMessage, LoadingState],
  templateUrl: './hotel-network-carousel.html',
  styleUrl: './hotel-network-carousel.scss',
})
export class HotelNetworkCarousel {
  readonly hotels = input.required<readonly Hotel[]>();
  readonly loading = input(false);
  readonly problem = input<ProblemDetail | null>(null);

  protected readonly activeIndex = signal(0);
  protected readonly hasMultipleHotels = computed(() => this.hotels().length > 1);
  protected readonly failedImageIds = signal<ReadonlySet<number>>(new Set());

  private readonly syncActiveHotel = effect(() => {
    const count = this.hotels().length;

    if (!count) {
      this.activeIndex.set(0);
      return;
    }

    if (this.activeIndex() >= count) {
      this.activeIndex.set(count - 1);
    }
  });

  protected showPreviousHotel(): void {
    this.move(-1);
  }

  protected showNextHotel(): void {
    this.move(1);
  }

  protected selectHotel(index: number): void {
    this.activeIndex.set(index);
  }

  protected slidePosition(index: number): 'active' | 'previous' | 'next' | 'hidden' {
    const count = this.hotels().length;

    if (!count || index === this.activeIndex()) {
      return 'active';
    }

    if (index === this.normalizeIndex(this.activeIndex() - 1, count)) {
      return 'previous';
    }

    if (index === this.normalizeIndex(this.activeIndex() + 1, count)) {
      return 'next';
    }

    return 'hidden';
  }

  protected imageUrl(hotel: Hotel): string {
    return hotelPhotoUrl(hotel.hotelId);
  }

  protected hasImage(hotel: Hotel): boolean {
    return !this.failedImageIds().has(hotel.hotelId);
  }

  protected markImageFailed(hotel: Hotel): void {
    this.failedImageIds.update((failedIds) => {
      const nextFailedIds = new Set(failedIds);
      nextFailedIds.add(hotel.hotelId);
      return nextFailedIds;
    });
  }

  protected locationLabel(hotel: Hotel): string {
    return `${hotel.city}, ${hotel.country}`.toUpperCase();
  }

  protected description(hotel: Hotel): string {
    return hotel.description || hotel.address;
  }

  protected starsLabel(hotel: Hotel): string {
    return `${hotel.stars} ${hotel.stars === 1 ? 'star' : 'stars'}`;
  }

  protected childrenPolicyLabel(hotel: Hotel): string {
    return hotel.childrenAllowed ? 'Children welcome' : 'Adults only';
  }

  protected petsPolicyLabel(hotel: Hotel): string {
    return hotel.petsAllowed ? 'Pets welcome' : 'No pets';
  }

  protected statusLabel(hotel: Hotel): string {
    return toTitleCase(hotel.status.replace(/_/g, ' '));
  }

  protected searchParams(hotel: Hotel): Record<string, string | number> {
    return {
      destination: hotel.city,
      hotelId: hotel.hotelId,
    };
  }

  protected imageAlt(hotel: Hotel): string {
    return `${hotel.name} hotel`;
  }

  protected trackHotel(_: number, hotel: Hotel): number {
    return hotel.hotelId;
  }

  private move(offset: number): void {
    const count = this.hotels().length;

    if (!count) {
      return;
    }

    this.activeIndex.set(this.normalizeIndex(this.activeIndex() + offset, count));
  }

  private normalizeIndex(index: number, count: number): number {
    return (index + count) % count;
  }
}
