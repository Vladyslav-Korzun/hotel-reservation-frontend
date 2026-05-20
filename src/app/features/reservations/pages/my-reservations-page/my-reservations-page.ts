import { Component, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { toProblemDetail } from '../../../../core/http/api-error.util';
import { ProblemDetail } from '../../../../core/http/problem-detail.model';
import { ErrorMessage } from '../../../../shared/ui/error-message/error-message';
import { LoadingState } from '../../../../shared/ui/loading-state/loading-state';
import { ReservationList } from '../../components/reservation-list/reservation-list';
import { Reservation } from '../../model/reservation.model';
import { ReservationsFacade } from '../../services/reservations.facade';

@Component({
  selector: 'app-my-reservations-page',
  imports: [ErrorMessage, LoadingState, ReservationList],
  templateUrl: './my-reservations-page.html',
  styleUrl: './my-reservations-page.scss',
})
export class MyReservationsPage {
  private readonly reservationsFacade = inject(ReservationsFacade);

  protected readonly loading = signal(false);
  protected readonly problem = signal<ProblemDetail | null>(null);
  protected readonly reservations = signal<Reservation[]>([]);

  constructor() {
    this.loadMyReservations();
  }

  protected reload(): void {
    this.loadMyReservations();
  }

  private loadMyReservations(): void {
    this.problem.set(null);
    this.loading.set(true);

    this.reservationsFacade
      .listMyReservations()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (reservations) => this.reservations.set(reservations),
        error: (error: unknown) => {
          this.reservations.set([]);
          this.problem.set(toProblemDetail(error));
        },
      });
  }
}
