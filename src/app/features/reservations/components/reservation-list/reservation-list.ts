import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { formatAccommodationPartySummary } from '../../../../shared/accommodation/accommodation-party-presenter.util';
import { toDisplayDate } from '../../../../shared/date/display-date.util';
import { StatusBadge } from '../../../../shared/ui/status-badge/status-badge';
import { Reservation } from '../../model/reservation.model';

@Component({
  selector: 'app-reservation-list',
  imports: [RouterLink, StatusBadge],
  templateUrl: './reservation-list.html',
  styleUrl: './reservation-list.scss',
})
export class ReservationList {
  readonly reservations = input<Reservation[]>([]);

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
    return formatAccommodationPartySummary(reservation);
  }
}
