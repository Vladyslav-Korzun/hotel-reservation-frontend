import { CurrencyPipe } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';
import { formatAccommodationPartySummary } from '../../../../shared/accommodation/accommodation-party-presenter.util';
import { AccommodationParty, BookingPet } from '../../../../shared/accommodation/accommodation-party.model';
import { BookingPolicy, UNKNOWN_BOOKING_POLICY } from '../../../../shared/accommodation/booking-policy';
import { classifyGuests } from '../../../../shared/accommodation/guest-classification.util';
import { calcNights, parseDisplayDate, toDisplayDate } from '../../../../shared/date/display-date.util';
import { HotelServiceOffering } from '../../../hotels/model/hotel.model';
import { inferServicePricing } from '../../../hotels/model/service-pricing.util';
import { ReservationServiceSelection } from '../../model/reservation.model';
import { GuestDetailGroup } from '../../wizard/guest-detail';
import { WizardStep } from '../../wizard/wizard-step';

interface GuestRow {
  label: string;
  isBooker: boolean;
  filledIn: boolean;
  fullName: string;
  meta: string;
}

@Component({
  selector: 'app-step-review',
  imports: [CurrencyPipe],
  templateUrl: './step-review.html',
  styleUrl: './step-review.scss',
})
export class StepReview {
  readonly checkIn = input.required<string>();
  readonly checkOut = input.required<string>();
  readonly party = input.required<AccommodationParty>();
  readonly guests = input<readonly GuestDetailGroup[]>([]);
  readonly specialRequests = input<string>('');
  readonly showSpecialRequests = input(true);
  readonly services = input<readonly HotelServiceOffering[]>([]);
  readonly serviceSelections = input<readonly ReservationServiceSelection[]>([]);
  readonly submitting = input(false);
  readonly policy = input<BookingPolicy>(UNKNOWN_BOOKING_POLICY);

  readonly editStep = output<WizardStep>();
  readonly confirm = output<void>();

  protected readonly steps = WizardStep;

  protected readonly nights = computed(() =>
    calcNights(parseDisplayDate(this.checkIn()), parseDisplayDate(this.checkOut())),
  );

  protected readonly stayDatesLabel = computed(() => {
    const inIso = parseDisplayDate(this.checkIn());
    const outIso = parseDisplayDate(this.checkOut());
    if (!inIso || !outIso) return '—';
    return `${formatPretty(inIso)} → ${formatPretty(outIso)}`;
  });

  protected readonly cancellationDeadline = computed(() => {
    const inIso = parseDisplayDate(this.checkIn());
    if (!inIso) return '';
    const date = new Date(`${inIso}T15:00:00`);
    date.setDate(date.getDate() - 1);
    return date.toLocaleDateString('en', { day: 'numeric', month: 'short' }) + ', 15:00';
  });

  protected readonly partySummary = computed(() => formatAccommodationPartySummary(this.party()));

  protected readonly childrenSummary = computed(() => {
    const ages = this.party().childrenAges;
    if (!ages.length) return 'None';
    const { childCount, infantCount, adultEquivalentMinorCount } = classifyGuests(
      this.party().adults,
      ages,
      this.policy(),
    );
    const parts: string[] = [];
    if (childCount > 0) parts.push(`${childCount} ${childCount === 1 ? 'child' : 'children'}`);
    if (infantCount > 0) parts.push(`${infantCount} ${infantCount === 1 ? 'infant' : 'infants'}`);
    if (adultEquivalentMinorCount > 0) {
      parts.push(
        `${adultEquivalentMinorCount} ${adultEquivalentMinorCount === 1 ? 'teen' : 'teens'} (counts as ${adultEquivalentMinorCount === 1 ? 'adult' : 'adults'})`,
      );
    }
    const breakdown = parts.length ? ` · ${parts.join(' + ')}` : '';
    return `${ages.length} · ages ${ages.join(', ')}${breakdown}`;
  });

  protected readonly petsSummary = computed(() => formatPetsCompact(this.party().pets));

  protected readonly guestRows = computed<readonly GuestRow[]>(() => {
    let adultIdx = 0;
    let childIdx = 0;
    return this.guests().map((g, i) => {
      const isAdult = g.controls.role.value === 'ADULT';
      const positionLabel = isAdult ? `Adult ${++adultIdx}` : `Child ${++childIdx}`;
      const firstName = g.controls.firstName.value.trim();
      const lastName = g.controls.lastName.value.trim();
      const filledIn = !!(firstName || lastName);
      const fullName = filledIn ? `${firstName} ${lastName}`.trim() : '—';
      // DOB is stored as DD.MM.YYYY display string from the masked input.
      const dobDisplay = g.controls.dateOfBirth.value;
      const dobIso = dobDisplay ? parseDisplayDate(dobDisplay) : null;
      const dob = dobIso ? formatPretty(dobIso) : null;
      const gender = g.controls.gender.value;
      const parts: string[] = [];
      if (gender) parts.push(gender[0]);
      if (dob) parts.push(dob);
      return {
        label: i === 0 ? `${positionLabel} · Booker` : positionLabel,
        isBooker: i === 0,
        filledIn,
        fullName,
        meta: filledIn ? parts.join(' · ') : 'not filled in',
      };
    });
  });

  protected readonly serviceRows = computed(() => {
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

  protected onEdit(step: WizardStep): void {
    this.editStep.emit(step);
  }
}

function formatPretty(isoDate: string): string {
  const d = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(d.getTime())) return toDisplayDate(isoDate) || isoDate;
  return d.toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatPetsCompact(pets: readonly BookingPet[]): string {
  if (!pets.length) return 'None';
  return pets.map((p) => `${p.type.toLowerCase()} ${p.weightKg}kg`).join(', ');
}
