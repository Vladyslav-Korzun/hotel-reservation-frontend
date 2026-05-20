import { Component, ElementRef, computed, input, viewChild } from '@angular/core';
import { RoomSimilarCard } from '../../../stays/components/room-similar-card/room-similar-card';
import { StayOption } from '../../../stays/model/stay-search.model';

/**
 * Horizontal scroll-snap row of rooms. Uses native overflow + scroll-snap,
 * with two arrow buttons that scrollBy one card width.
 * Mobile: arrows hidden; swipe is the primary affordance.
 */
@Component({
  selector: 'app-hotel-rooms-carousel',
  imports: [RoomSimilarCard],
  templateUrl: './hotel-rooms-carousel.html',
  styleUrl: './hotel-rooms-carousel.scss',
})
export class HotelRoomsCarousel {
  readonly rooms = input.required<readonly StayOption[]>();
  readonly currentHotelId = input.required<number>();
  readonly checkIn = input('');
  readonly checkOut = input('');
  readonly location = input('');

  private readonly track = viewChild<ElementRef<HTMLDivElement>>('track');

  protected readonly hasArrows = computed(() => this.rooms().length > 2);

  protected scrollBy(delta: 1 | -1): void {
    const el = this.track()?.nativeElement;
    if (!el) return;
    const firstCard = el.querySelector<HTMLElement>('.hotel-rooms-carousel__cell');
    const step = firstCard ? firstCard.getBoundingClientRect().width + 18 /* gap */ : 320;
    el.scrollBy({ left: delta * step, behavior: 'smooth' });
  }
}
