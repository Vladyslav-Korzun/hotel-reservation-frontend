import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { distinctUntilChanged, finalize, map } from 'rxjs';
import { toProblemDetail } from '../../../../core/http/api-error.util';
import { ProblemDetail } from '../../../../core/http/problem-detail.model';
import { ErrorMessage } from '../../../../shared/ui/error-message/error-message';
import { LoadingState } from '../../../../shared/ui/loading-state/loading-state';
import { ReservationSummary } from '../../components/reservation-summary/reservation-summary';
import { Reservation } from '../../model/reservation.model';
import { isCancellableReservation } from '../../model/reservation-status';
import { ReservationsFacade } from '../../services/reservations.facade';

@Component({
  selector: 'app-reservation-detail-page',
  imports: [ErrorMessage, LoadingState, ReservationSummary],
  templateUrl: './reservation-detail-page.html',
  styleUrl: './reservation-detail-page.scss',
})
export class ReservationDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly reservations = inject(ReservationsFacade);
  private readonly reservationId = signal('');

  protected readonly loading = signal(true);
  protected readonly cancelling = signal(false);
  protected readonly reservation = signal<Reservation | null>(null);
  protected readonly problem = signal<ProblemDetail | null>(null);

  constructor() {
    this.route.paramMap
      .pipe(
        map((paramMap) => paramMap.get('reservationId') ?? ''),
        distinctUntilChanged(),
        takeUntilDestroyed(),
      )
      .subscribe((reservationId) => {
        this.reservationId.set(reservationId);
        this.loadReservation(reservationId);
      });
  }

  protected canCancel(reservation: Reservation): boolean {
    return isCancellableReservation(reservation.status) && !this.cancelling();
  }

  protected cancelReservation(): void {
    const reservationId = this.reservationId();
    if (!reservationId || this.cancelling()) {
      return;
    }

    this.problem.set(null);
    this.cancelling.set(true);

    this.reservations
      .cancelReservation(reservationId)
      .pipe(finalize(() => this.cancelling.set(false)))
      .subscribe({
        next: () => this.loadReservation(reservationId),
        error: (error: unknown) => this.problem.set(toProblemDetail(error)),
      });
  }

  private loadReservation(reservationId: string): void {
    if (!reservationId) {
      this.reservation.set(null);
      this.loading.set(false);
      return;
    }

    this.problem.set(null);
    this.loading.set(true);

    this.reservations
      .getReservation(reservationId)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (reservation) => this.reservation.set(reservation),
        error: (error: unknown) => this.problem.set(toProblemDetail(error)),
      });
  }
}
