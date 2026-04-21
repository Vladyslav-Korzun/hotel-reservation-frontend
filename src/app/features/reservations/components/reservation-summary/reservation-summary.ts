import { Component, input } from '@angular/core';
import { DatePipe } from '@angular/common';
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
}
