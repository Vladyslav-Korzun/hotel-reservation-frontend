import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { distinctUntilChanged, finalize, map } from 'rxjs';
import { AuthService } from '../../../../core/auth/auth.service';
import { toProblemDetail } from '../../../../core/http/api-error.util';
import { ProblemDetail } from '../../../../core/http/problem-detail.model';
import { ErrorMessage } from '../../../../shared/ui/error-message/error-message';
import { LoadingState } from '../../../../shared/ui/loading-state/loading-state';
import { ReservationSummary } from '../../components/reservation-summary/reservation-summary';
import { Reservation, isCancellableReservation, isCheckInAllowedReservation, isCheckOutAllowedReservation } from '../../model/reservation.model';
import { ReservationsFacade } from '../../services/reservations.facade';

@Component({
  selector: 'app-reservation-detail-page',
  imports: [ErrorMessage, LoadingState, ReservationSummary],
  templateUrl: './reservation-detail-page.html',
  styleUrl: './reservation-detail-page.scss',
})
export class ReservationDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AuthService);
  private readonly reservations = inject(ReservationsFacade);
  private readonly reservationId = signal('');

  protected readonly loading = signal(true);
  protected readonly cancelling = signal(false);
  protected readonly checkingIn = signal(false);
  protected readonly checkingOut = signal(false);
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

  protected canCheckIn(reservation: Reservation): boolean {
    return (
      this.auth.hasAnyRole(['STAFF', 'ADMIN']) &&
      isCheckInAllowedReservation(reservation.status) &&
      isWithinCheckInWindow(reservation) &&
      !this.checkingIn()
    );
  }

  protected canCheckOut(reservation: Reservation): boolean {
    return this.auth.hasAnyRole(['STAFF', 'ADMIN']) && isCheckOutAllowedReservation(reservation.status) && !this.checkingOut();
  }

  protected stayOperationsHint(reservation: Reservation): string {
    if (!this.auth.hasAnyRole(['STAFF', 'ADMIN'])) {
      return 'Only staff and administrators can manage check-in and check-out.';
    }

    if (reservation.status === 'CHECKED_IN') {
      return 'This reservation is currently checked in and can be checked out.';
    }

    if (reservation.status === 'CHECKED_OUT') {
      return 'This reservation has already been checked out.';
    }

    if (reservation.status === 'CANCELLED') {
      return 'Cancelled reservations cannot be checked in or checked out.';
    }

    if (reservation.status === 'NO_SHOW') {
      return 'No-show reservations cannot be checked in or checked out.';
    }

    if (!isWithinCheckInWindow(reservation)) {
      return 'Check-in is available only from the arrival date until before the check-out date.';
    }

    return 'This reservation is eligible for check-in.';
  }

  protected cancelReservation(): void {
    const reservationId = this.reservationId();
    if (!reservationId || this.cancelling()) {
      return;
    }

    if (!window.confirm('Cancel this reservation?')) {
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

  protected checkInReservation(): void {
    const reservationId = this.reservationId();
    if (!reservationId || this.checkingIn()) {
      return;
    }

    this.problem.set(null);
    this.checkingIn.set(true);

    this.reservations
      .checkInReservation(reservationId)
      .pipe(finalize(() => this.checkingIn.set(false)))
      .subscribe({
        next: (reservation) => this.reservation.set(reservation),
        error: (error: unknown) => this.problem.set(toProblemDetail(error)),
      });
  }

  protected checkOutReservation(): void {
    const reservationId = this.reservationId();
    if (!reservationId || this.checkingOut()) {
      return;
    }

    this.problem.set(null);
    this.checkingOut.set(true);

    this.reservations
      .checkOutReservation(reservationId)
      .pipe(finalize(() => this.checkingOut.set(false)))
      .subscribe({
        next: (reservation) => this.reservation.set(reservation),
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

function isWithinCheckInWindow(reservation: Reservation): boolean {
  const todayUtc = new Date().toISOString().slice(0, 10);
  return todayUtc >= reservation.checkIn && todayUtc < reservation.checkOut;
}
