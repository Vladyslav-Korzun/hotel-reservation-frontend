import { CurrencyPipe } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { formatAccommodationPartySummary } from '../../../../shared/accommodation/accommodation-party-presenter.util';
import { AccommodationParty } from '../../../../shared/accommodation/accommodation-party.model';
import { calcNights, parseDisplayDate } from '../../../../shared/date/display-date.util';
import { HotelServiceOffering } from '../../../hotels/model/hotel.model';
import { inferServicePricing } from '../../../hotels/model/service-pricing.util';
import { ReservationServiceSelection } from '../../model/reservation.model';

export interface SummaryDisplayDetails {
  hotelName: string;
  roomName: string;
  location: string;
  photoUrl: string;
}

@Component({
  selector: 'app-live-reservation-summary',
  imports: [CurrencyPipe],
  templateUrl: './live-reservation-summary.html',
  styleUrl: './live-reservation-summary.scss',
})
export class LiveReservationSummary {
  readonly displayDetails = input.required<SummaryDisplayDetails>();
  /** ISO check-in (yyyy-MM-dd) — accepts display format too */
  readonly checkIn = input<string>('');
  readonly checkOut = input<string>('');
  readonly party = input.required<AccommodationParty>();
  readonly services = input<HotelServiceOffering[]>([]);
  readonly serviceSelections = input<ReservationServiceSelection[]>([]);
  /** Nightly base price (from the originating stay-card URL params) — €0 if unknown */
  readonly nightlyPrice = input<number>(0);
  readonly currency = input<string>('EUR');

  protected readonly nights = computed(() =>
    calcNights(toIso(this.checkIn()), toIso(this.checkOut())),
  );

  protected readonly partySummary = computed(() => formatAccommodationPartySummary(this.party()));

  protected readonly checkInDate = computed(() => parseDateOrNull(this.checkIn()));
  protected readonly checkOutDate = computed(() => parseDateOrNull(this.checkOut()));

  protected readonly roomTotal = computed(() => this.nightlyPrice() * this.nights());

  protected readonly serviceLines = computed(() => {
    const byId = new Map(this.services().map((s) => [s.serviceOfferingId, s]));
    const nights = this.nights();
    return this.serviceSelections().flatMap((sel) => {
      const svc = byId.get(sel.serviceOfferingId);
      if (!svc) return [];
      const perNight = inferServicePricing(svc) === 'PER_NIGHT';
      const multiplier = perNight ? nights : 1;
      return [
        {
          name: svc.name,
          qty: sel.quantity,
          perNight,
          nights,
          total: sel.quantity * svc.priceAmount * multiplier,
          currency: svc.priceCurrency,
        },
      ];
    });
  });

  protected readonly servicesTotal = computed(() =>
    this.serviceLines().reduce((sum, l) => sum + l.total, 0),
  );

  protected readonly grandTotal = computed(() => this.roomTotal() + this.servicesTotal());

  protected formatDay(date: Date | null, opt: 'day-month' | 'weekday-year'): string {
    if (!date) return '—';
    if (opt === 'day-month') {
      return date.toLocaleDateString('en', { day: 'numeric', month: 'short' });
    }
    return date.toLocaleDateString('en', { weekday: 'short', year: 'numeric' });
  }
}

function toIso(value: string): string | null {
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return parseDisplayDate(value);
}

function parseDateOrNull(value: string): Date | null {
  const iso = toIso(value);
  if (!iso) return null;
  const date = new Date(`${iso}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}
