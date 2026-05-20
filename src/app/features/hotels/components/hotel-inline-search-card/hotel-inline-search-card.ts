import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { StaySearchForm } from '../../../stays/components/stay-search-form/stay-search-form';
import { StaySearchCriteria } from '../../../stays/model/stay-search.model';
import { Hotel } from '../../model/hotel.model';

/**
 * Sticky search card on the right column of the hotel detail page.
 * Owns the chrome (eyebrow, title, price hint, trust list) and delegates
 * the actual fields to the shared `StaySearchForm` in `compact` mode with
 * city + hotel selectors hidden (they're already fixed by the current hotel).
 *
 * On submit, navigates to `/stays/search` with `hotelId` prefilled.
 */
@Component({
  selector: 'app-hotel-inline-search-card',
  imports: [CurrencyPipe, StaySearchForm],
  templateUrl: './hotel-inline-search-card.html',
  styleUrl: './hotel-inline-search-card.scss',
})
export class HotelInlineSearchCard {
  private readonly router = inject(Router);

  readonly hotel = input.required<Hotel>();
  /** Lowest nightly price among loaded rooms — drives the "Rooms from €X" hint. Null hides it. */
  readonly minPriceAmount = input<number | null>(null);
  readonly minPriceCurrency = input<string>('EUR');

  /** Pre-fill: lock the form to this hotel + city by default. */
  protected readonly initialCriteria = computed<StaySearchCriteria>(() => {
    const h = this.hotel();
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    return {
      destination: h.city,
      hotelId: h.hotelId,
      checkIn: isoDate(today),
      checkOut: isoDate(tomorrow),
      adults: 2,
      childrenAges: [],
      pets: [],
    };
  });

  protected readonly showPriceHint = computed(() => {
    const v = this.minPriceAmount();
    return typeof v === 'number' && Number.isFinite(v) && v > 0;
  });

  protected onSubmitted(criteria: StaySearchCriteria): void {
    // Force the hotelId back in case the user cleared it via some other path.
    void this.router.navigate(['/stays/search'], {
      queryParams: {
        destination: criteria.destination,
        hotelId: this.hotel().hotelId,
        checkIn: criteria.checkIn,
        checkOut: criteria.checkOut,
        adults: criteria.adults,
        ...(criteria.childrenAges.length
          ? { childrenAges: criteria.childrenAges.join(',') }
          : {}),
      },
    });
  }
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}
