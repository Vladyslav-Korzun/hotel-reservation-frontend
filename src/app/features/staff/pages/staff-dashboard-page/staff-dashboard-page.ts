import { Component, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { toProblemDetail } from '../../../../core/http/api-error.util';
import { ProblemDetail } from '../../../../core/http/problem-detail.model';
import { ErrorMessage } from '../../../../shared/ui/error-message/error-message';
import { LoadingState } from '../../../../shared/ui/loading-state/loading-state';
import { StatusBadge } from '../../../../shared/ui/status-badge/status-badge';
import { Reservation } from '../../../reservations/model/reservation.model';
import {
  ReservationOperationsTable,
} from '../../components/reservation-operations-table/reservation-operations-table';
import { RoomStatusForm, RoomStatusUpdate } from '../../components/room-status-form/room-status-form';
import { RoomOperation } from '../../model/room-operation.model';
import { StaffFacade } from '../../services/staff.facade';

@Component({
  selector: 'app-staff-dashboard-page',
  imports: [ErrorMessage, LoadingState, ReservationOperationsTable, RoomStatusForm, StatusBadge],
  templateUrl: './staff-dashboard-page.html',
  styleUrl: './staff-dashboard-page.scss',
})
export class StaffDashboardPage {
  private readonly staffFacade = inject(StaffFacade);

  protected readonly reservations = signal<Reservation[]>([]);
  protected readonly latestRoomOperation = signal<RoomOperation | null>(null);
  protected readonly loadingReservations = signal(false);
  protected readonly updatingRoom = signal(false);
  protected readonly busyReservationId = signal<string | null>(null);
  protected readonly problem = signal<ProblemDetail | null>(null);

  constructor() {
    this.loadReservations();
  }

  protected reload(): void {
    this.loadReservations();
  }

  protected checkIn(reservationId: string): void {
    this.runReservationOperation(reservationId, () => this.staffFacade.checkInReservation(reservationId));
  }

  protected checkOut(reservationId: string): void {
    this.runReservationOperation(reservationId, () => this.staffFacade.checkOutReservation(reservationId));
  }

  protected markNoShow(reservationId: string): void {
    if (!window.confirm('Mark this reservation as no-show?')) {
      return;
    }

    this.runReservationOperation(reservationId, () => this.staffFacade.markNoShowReservation(reservationId));
  }

  protected updateRoomStatus(update: RoomStatusUpdate): void {
    this.problem.set(null);
    this.updatingRoom.set(true);

    this.staffFacade
      .updateRoomStatus(update.roomId, update.status)
      .pipe(finalize(() => this.updatingRoom.set(false)))
      .subscribe({
        next: (room) => this.latestRoomOperation.set(room),
        error: (error: unknown) => {
          this.latestRoomOperation.set(null);
          this.problem.set(toProblemDetail(error));
        },
      });
  }

  private loadReservations(): void {
    this.problem.set(null);
    this.loadingReservations.set(true);

    this.staffFacade
      .listReservations()
      .pipe(finalize(() => this.loadingReservations.set(false)))
      .subscribe({
        next: (reservations) => this.reservations.set(reservations),
        error: (error: unknown) => {
          this.reservations.set([]);
          this.problem.set(toProblemDetail(error));
        },
      });
  }

  private runReservationOperation(reservationId: string, operation: () => ReturnType<StaffFacade['checkInReservation']>): void {
    this.problem.set(null);
    this.busyReservationId.set(reservationId);

    operation()
      .pipe(finalize(() => this.busyReservationId.set(null)))
      .subscribe({
        next: (reservation) => this.replaceReservation(reservation),
        error: (error: unknown) => this.problem.set(toProblemDetail(error)),
      });
  }

  private replaceReservation(updated: Reservation): void {
    this.reservations.update((reservations) =>
      reservations.map((reservation) =>
        reservation.reservationId === updated.reservationId ? updated : reservation,
      ),
    );
  }
}
