import { Component, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import {
  formatAccommodationPartySummary,
  formatChildrenAgesSummary,
  formatPetsSummary,
} from '../../../../shared/accommodation/accommodation-party-presenter.util';
import { StatusBadge } from '../../../../shared/ui/status-badge/status-badge';
import { Reservation } from '../../model/reservation.model';

@Component({
  selector: 'app-reservation-summary',
  imports: [DatePipe, StatusBadge],
  templateUrl: './reservation-summary.html',
  styleUrl: './reservation-summary.scss',
})
export class ReservationSummary {
  readonly reservation = input.required<Reservation>();

  protected partySummary(reservation: Reservation): string {
    return formatAccommodationPartySummary(reservation);
  }

  protected childrenSummary(reservation: Reservation): string {
    return formatChildrenAgesSummary(reservation.childrenAges);
  }

  protected petsSummary(reservation: Reservation): string {
    return formatPetsSummary(reservation.pets);
  }
}
