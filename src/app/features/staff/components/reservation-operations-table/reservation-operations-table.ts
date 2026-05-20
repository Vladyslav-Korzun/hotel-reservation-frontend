import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { toDisplayDate } from '../../../../shared/date/display-date.util';
import { StatusBadge } from '../../../../shared/ui/status-badge/status-badge';
import { Reservation } from '../../../reservations/model/reservation.model';

@Component({
  selector: 'app-reservation-operations-table',
  imports: [RouterLink, StatusBadge],
  templateUrl: './reservation-operations-table.html',
  styleUrl: './reservation-operations-table.scss',
})
export class ReservationOperationsTable {
  readonly reservations = input<readonly Reservation[]>([]);
  readonly busyReservationId = input<string | null>(null);
  readonly checkInRequested = output<string>();
  readonly checkOutRequested = output<string>();
  readonly noShowRequested = output<string>();

  protected displayDate(value: string): string {
    return toDisplayDate(value) || value;
  }

  protected isBusy(reservation: Reservation): boolean {
    return this.busyReservationId() === reservation.reservationId;
  }
}
