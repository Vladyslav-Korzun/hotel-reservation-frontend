import { Component, input, output } from '@angular/core';
import { hotelPhotoUrl } from '../../../../shared/assets/placeholder-images';
import { toDisplayDate } from '../../../../shared/date/display-date.util';
import { StatusBadge } from '../../../../shared/ui/status-badge/status-badge';
import {
  Reservation,
  StayingGuest,
  isCancellableReservation,
} from '../../model/reservation.model';

export interface ReservationHotelDisplay {
  name: string;
  location: string;
}

@Component({
  selector: 'app-reservation-list',
  imports: [StatusBadge],
  templateUrl: './reservation-list.html',
  styleUrl: './reservation-list.scss',
})
export class ReservationList {
  readonly reservations = input<Reservation[]>([]);
  readonly expandedReservationId = input<string | null>(null);
  readonly cancelingReservationId = input<string | null>(null);
  readonly allowCancellation = input(false);
  readonly hotels = input<Record<number, ReservationHotelDisplay>>({});
  /** roomTypeId → display name, built from hotel room-type data loaded by the parent page */
  readonly roomTypes = input<Record<number, string>>({});
  readonly emptyTitle = input('No reservations found');
  readonly emptyMessage = input('No bookings match the current reservation view.');

  readonly toggleDetails = output<string>();
  readonly cancelReservation = output<string>();

  protected displayDate(value: string): string {
    return toDisplayDate(value) || value;
  }

  protected displayDateTime(value: string): string {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  protected partySummary(reservation: Reservation): string {
    const parts: string[] = [];

    if (reservation.adults > 0) {
      parts.push(`${reservation.adults} ${reservation.adults === 1 ? 'adult' : 'adults'}`);
    }

    if (reservation.childrenAges.length > 0) {
      parts.push(
        `${reservation.childrenAges.length} ${reservation.childrenAges.length === 1 ? 'child' : 'children'}`,
      );
    }

    if (reservation.pets.length > 0) {
      parts.push(`${reservation.pets.length} ${reservation.pets.length === 1 ? 'pet' : 'pets'}`);
    }

    if (parts.length > 0) {
      return parts.join(', ');
    }

    if (reservation.stayingGuests.length > 0) {
      return `${reservation.stayingGuests.length} ${reservation.stayingGuests.length === 1 ? 'guest' : 'guests'}`;
    }

    return 'Guest details pending';
  }

  protected displayPrice(reservation: Reservation): string {
    if (reservation.finalPriceAmount === null) {
      return 'Price pending';
    }

    return this.formatMoney(reservation.finalPriceAmount, reservation.finalPriceCurrency);
  }

  protected hotelName(reservation: Reservation): string {
    return this.hotels()[reservation.hotelId]?.name || 'Your hotel stay';
  }

  protected hotelLocation(reservation: Reservation): string {
    return this.hotels()[reservation.hotelId]?.location || 'Hotel booking';
  }

  protected roomLabel(reservation: Reservation): string {
    return this.roomTypes()[reservation.roomTypeId]
      ?? (reservation.roomId === null ? 'Reserved room' : 'Assigned room');
  }

  protected roomDescription(reservation: Reservation): string {
    const typeName = this.roomTypes()[reservation.roomTypeId];
    if (reservation.roomId === null) {
      return typeName
        ? `${typeName} — exact room assigned by the hotel before check-in.`
        : 'The exact room will be assigned by the hotel before check-in.';
    }
    return typeName
      ? `${typeName} — your room has been assigned for this stay.`
      : 'Your room has been assigned for this stay.';
  }

  protected bookingReference(reservation: Reservation): string {
    const compact = reservation.reservationId.replaceAll('-', '').toUpperCase();
    return compact.length > 8 ? compact.slice(-8) : compact;
  }

  protected servicePrice(amount: number, currency: string): string {
    return this.formatMoney(amount, currency);
  }

  private formatMoney(amount: number, currency: string | null): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency ?? 'EUR',
      maximumFractionDigits: 2,
    }).format(amount);
  }

  protected displayNights(reservation: Reservation): string {
    const nights = this.nights(reservation);
    return `${nights} ${nights === 1 ? 'night' : 'nights'}`;
  }

  protected isExpanded(reservation: Reservation): boolean {
    return this.expandedReservationId() === reservation.reservationId;
  }

  protected canCancel(reservation: Reservation): boolean {
    return isCancellableReservation(reservation.status);
  }

  protected isCanceling(reservation: Reservation): boolean {
    return this.cancelingReservationId() === reservation.reservationId;
  }

  protected photoUrl(hotelId: number): string {
    return hotelPhotoUrl(hotelId);
  }

  protected guestName(guest: StayingGuest): string {
    return `${guest.firstName} ${guest.lastName}`.trim();
  }

  protected genderLabel(gender: StayingGuest['gender']): string {
    const labels: Record<StayingGuest['gender'], string> = {
      MALE: 'Male',
      FEMALE: 'Female',
      OTHER: 'Other',
    };

    return labels[gender];
  }

  private nights(reservation: Reservation): number {
    const checkIn = new Date(`${reservation.checkIn}T00:00:00`);
    const checkOut = new Date(`${reservation.checkOut}T00:00:00`);
    const diff = checkOut.getTime() - checkIn.getTime();

    if (!Number.isFinite(diff) || diff <= 0) {
      return 1;
    }

    return Math.max(1, Math.round(diff / 86_400_000));
  }
}
