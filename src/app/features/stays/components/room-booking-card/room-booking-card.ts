import { CurrencyPipe } from '@angular/common';
import { Component, ViewEncapsulation, computed, effect, inject, input, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Params, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth.service';
import { BookingPet } from '../../../../shared/accommodation/accommodation-party.model';
import { accommodationPartyToQueryParams } from '../../../../shared/accommodation/accommodation-party-query.util';
import {
  calcNights,
  parseDisplayDate,
  toDisplayDate,
  todayDisplayDate,
  tomorrowDisplayDate,
} from '../../../../shared/date/display-date.util';
import { HotelServiceOffering } from '../../../hotels/model/hotel.model';
import { inferServicePricing } from '../../../hotels/model/service-pricing.util';
import { AvailabilityByDate, RoomAvailabilityDay } from '../../model/availability.model';
import { StaysFacade } from '../../services/stays.facade';
import { DateRangePicker } from '../date-range-picker/date-range-picker';

const SERVICES_PREVIEW_LIMIT = 4;

@Component({
  selector: 'app-room-booking-card',
  imports: [RouterLink, CurrencyPipe, ReactiveFormsModule, DateRangePicker],
  templateUrl: './room-booking-card.html',
  styleUrl: './room-booking-card.scss',
  encapsulation: ViewEncapsulation.None,
})
export class RoomBookingCard {
  private readonly auth = inject(AuthService);
  private readonly staysFacade = inject(StaysFacade);

  /* ── Static room info ────────────────────────────────────────────────── */
  readonly hotelId = input.required<number>();
  readonly hotelName = input('');
  readonly roomTypeId = input.required<number>();
  readonly roomName = input('');
  readonly location = input('');
  readonly nightlyPrice = input.required<number>();
  readonly currency = input.required<string>();
  readonly availableCount = input.required<number>();
  readonly services = input<HotelServiceOffering[]>([]);
  readonly searchQueryParams = input.required<Params>();

  /* ── Initial booking values ──────────────────────────────────────────── */
  readonly checkIn = input(''); // ISO date
  readonly checkOut = input(''); // ISO date
  readonly adults = input(2);
  readonly childrenAges = input<number[]>([]);
  readonly pets = input<BookingPet[]>([]);

  /* ── Room capacity limits + hotel age policy (forwarded to reservation page) ── */
  readonly maxAdults = input(0);
  readonly maxChildren = input(0);
  readonly maxInfants = input(0);
  readonly maxTotalGuests = input(0);
  readonly petsAllowed = input(false);
  readonly maxPets = input(0);
  readonly infantMaxAge = input(2);
  readonly childMaxAge = input(12);
  readonly adultEquivalentAge = input(13);
  readonly childrenAllowed = input(true);

  /* ── Local form (dates only — guests are decided on the search page) ──── */
  protected readonly form = new FormGroup({
    checkIn: new FormControl(todayDisplayDate(), { nonNullable: true }),
    checkOut: new FormControl(tomorrowDisplayDate(), { nonNullable: true }),
  });

  /** Re-emits on every form change — basis for all reactive derivations. */
  private readonly formValue = toSignal(this.form.valueChanges, {
    initialValue: this.form.getRawValue(),
  });

  /* ── Availability calendar state ─────────────────────────────────────── */
  /** Loaded windows we've already fetched (to avoid re-requests on month nav). */
  private readonly loadedWindows = new Set<string>();
  protected readonly availabilityByDate = signal<AvailabilityByDate>({});

  /* ── Derived ─────────────────────────────────────────────────────────── */
  protected readonly showUrgency = computed(() => {
    const c = this.availableCount();
    return c > 0 && c <= 3;
  });
  protected readonly canSelfBook = computed(() => this.auth.hasAnyRole(['GUEST']));

  protected readonly nights = computed(() => {
    const v = this.formValue();
    return calcNights(parseDisplayDate(v.checkIn ?? ''), parseDisplayDate(v.checkOut ?? ''), { minimum: 1 });
  });

  protected readonly roomTotal = computed(() => this.nights() * this.nightlyPrice());

  /** Up to N services to preview on the card. Selection happens on the reservation page. */
  protected readonly previewServices = computed(() =>
    this.services()
      .slice(0, SERVICES_PREVIEW_LIMIT)
      .map((s) => ({ ...s, perNight: inferServicePricing(s) === 'PER_NIGHT' })),
  );

  protected readonly extraServicesCount = computed(() =>
    Math.max(0, this.services().length - SERVICES_PREVIEW_LIMIT),
  );

  protected readonly reserveQueryParams = computed<Params>(() => {
    this.formValue(); // depend on form changes
    const party = {
      adults: this.adults(),
      childrenAges: this.childrenAges(),
      pets: this.pets(),
    };
    return {
      hotelId: this.hotelId(),
      hotelName: this.hotelName(),
      roomTypeId: this.roomTypeId(),
      roomName: this.roomName(),
      location: this.location(),
      checkIn: parseDisplayDate(this.form.controls.checkIn.value) ?? '',
      checkOut: parseDisplayDate(this.form.controls.checkOut.value) ?? '',
      nightlyPrice: this.nightlyPrice(),
      currency: this.currency(),
      maxAdults: this.maxAdults(),
      maxChildren: this.maxChildren(),
      maxInfants: this.maxInfants(),
      maxTotalGuests: this.maxTotalGuests(),
      petsAllowed: this.petsAllowed(),
      maxPets: this.maxPets(),
      infantMaxAge: this.infantMaxAge(),
      childMaxAge: this.childMaxAge(),
      adultEquivalentAge: this.adultEquivalentAge(),
      childrenAllowed: this.childrenAllowed(),
      ...accommodationPartyToQueryParams(party),
    };
  });

  private initialized = false;

  constructor() {
    // Apply input dates to the form once. Subsequent input changes are ignored
    // so user edits in the booking card aren't overwritten.
    effect(() => {
      const checkIn = this.checkIn();
      const checkOut = this.checkOut();

      if (this.initialized) return;
      this.initialized = true;

      this.form.patchValue(
        {
          checkIn: toDisplayDate(checkIn) || todayDisplayDate(),
          checkOut: toDisplayDate(checkOut) || tomorrowDisplayDate(),
        },
        { emitEvent: false },
      );
    });
  }

  /** Called by DateRangePicker whenever its visible 2-month window changes. */
  protected onPickerRangeChange(range: { fromIso: string; toIso: string }): void {
    const hotelId = this.hotelId();
    const roomTypeId = this.roomTypeId();
    if (!hotelId || !roomTypeId) return;

    const windowKey = `${range.fromIso}|${range.toIso}`;
    if (this.loadedWindows.has(windowKey)) return;
    this.loadedWindows.add(windowKey);

    this.staysFacade
      .getAvailabilityCalendar(hotelId, roomTypeId, range.fromIso, range.toIso)
      .subscribe({
        next: (days) => this.mergeAvailability(days),
        error: () => {
          // Soft-fail: keep existing data, let user proceed. Backend re-validates on reserve.
          this.loadedWindows.delete(windowKey);
        },
      });
  }

  private mergeAvailability(days: readonly RoomAvailabilityDay[]): void {
    this.availabilityByDate.update((prev) => {
      const next = { ...prev };
      for (const d of days) next[d.date] = d;
      return next;
    });
  }
}
