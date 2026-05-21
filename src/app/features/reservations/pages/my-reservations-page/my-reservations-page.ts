import { Component, computed, inject, signal } from '@angular/core';
import { catchError, finalize, forkJoin, of } from 'rxjs';
import { toProblemDetail } from '../../../../core/http/api-error.util';
import { ProblemDetail } from '../../../../core/http/problem-detail.model';
import { ErrorMessage } from '../../../../shared/ui/error-message/error-message';
import { LoadingState } from '../../../../shared/ui/loading-state/loading-state';
import { Hotel } from '../../../hotels/model/hotel.model';
import { HotelsFacade } from '../../../hotels/services/hotels.facade';
import { ReservationHotelDisplay, ReservationList } from '../../components/reservation-list/reservation-list';
import { Reservation, isCancellableReservation } from '../../model/reservation.model';
import { ReservationsFacade } from '../../services/reservations.facade';

type ReservationFilter = 'all' | 'upcoming' | 'past' | 'cancelled';
type ReservationSort = 'checkInAsc' | 'checkInDesc' | 'createdDesc';

interface FilterCounts {
  all: number;
  upcoming: number;
  past: number;
  cancelled: number;
}

@Component({
  selector: 'app-my-reservations-page',
  imports: [ErrorMessage, LoadingState, ReservationList],
  templateUrl: './my-reservations-page.html',
  styleUrl: './my-reservations-page.scss',
})
export class MyReservationsPage {
  private readonly reservationsFacade = inject(ReservationsFacade);
  private readonly hotelsFacade = inject(HotelsFacade);

  protected readonly loading = signal(false);
  protected readonly problem = signal<ProblemDetail | null>(null);
  protected readonly reservations = signal<Reservation[]>([]);
  protected readonly hotels = signal<Record<number, ReservationHotelDisplay>>({});
  protected readonly activeFilter = signal<ReservationFilter>('all');
  protected readonly sortMode = signal<ReservationSort>('checkInAsc');
  protected readonly expandedReservationId = signal<string | null>(null);
  protected readonly pendingCancelReservationId = signal<string | null>(null);
  protected readonly cancelingReservationId = signal<string | null>(null);

  protected readonly filterOptions: ReadonlyArray<{ value: ReservationFilter; label: string }> = [
    { value: 'all', label: 'All' },
    { value: 'upcoming', label: 'Upcoming' },
    { value: 'past', label: 'Past' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  protected readonly filterCounts = computed<FilterCounts>(() => {
    const reservations = this.reservations();

    return {
      all: reservations.length,
      upcoming: reservations.filter((reservation) => this.matchesFilter(reservation, 'upcoming')).length,
      past: reservations.filter((reservation) => this.matchesFilter(reservation, 'past')).length,
      cancelled: reservations.filter((reservation) => this.matchesFilter(reservation, 'cancelled')).length,
    };
  });

  protected readonly filteredReservations = computed(() => {
    const filter = this.activeFilter();
    const sort = this.sortMode();

    return this.reservations()
      .filter((reservation) => this.matchesFilter(reservation, filter))
      .sort((a, b) => this.compareReservations(a, b, sort));
  });

  protected readonly pendingCancelReservation = computed(() => {
    const reservationId = this.pendingCancelReservationId();
    return reservationId
      ? this.reservations().find((reservation) => reservation.reservationId === reservationId) ?? null
      : null;
  });

  constructor() {
    this.loadMyReservations();
  }

  protected reload(): void {
    this.loadMyReservations();
  }

  protected setFilter(filter: ReservationFilter): void {
    this.activeFilter.set(filter);
  }

  protected onSortChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;

    if (value === 'checkInAsc' || value === 'checkInDesc' || value === 'createdDesc') {
      this.sortMode.set(value);
    }
  }

  protected toggleDetails(reservationId: string): void {
    this.expandedReservationId.update((current) => (current === reservationId ? null : reservationId));
  }

  protected requestCancel(reservationId: string): void {
    const reservation = this.reservations().find((item) => item.reservationId === reservationId);

    if (!reservation || !isCancellableReservation(reservation.status)) {
      return;
    }

    this.pendingCancelReservationId.set(reservationId);
  }

  protected closeCancelDialog(): void {
    if (this.cancelingReservationId()) {
      return;
    }

    this.pendingCancelReservationId.set(null);
  }

  protected confirmCancel(): void {
    const reservation = this.pendingCancelReservation();

    if (!reservation || this.cancelingReservationId()) {
      return;
    }

    this.problem.set(null);
    this.cancelingReservationId.set(reservation.reservationId);

    this.reservationsFacade
      .cancelReservation(reservation.reservationId)
      .pipe(finalize(() => this.cancelingReservationId.set(null)))
      .subscribe({
        next: () => {
          this.reservations.update((items) =>
            items.map((item) =>
              item.reservationId === reservation.reservationId
                ? { ...item, status: 'CANCELLED', cancelledAt: new Date().toISOString() }
                : item,
            ),
          );
          this.pendingCancelReservationId.set(null);
        },
        error: (error: unknown) => this.problem.set(toProblemDetail(error)),
      });
  }

  protected countFor(filter: ReservationFilter): number {
    return this.filterCounts()[filter];
  }

  protected emptyTitle(): string {
    return this.reservations().length ? 'No reservations in this view' : 'No reservations yet';
  }

  protected emptyMessage(): string {
    return this.reservations().length
      ? 'Try another filter or refresh the list.'
      : 'Your future bookings will appear here once they are created.';
  }

  private loadMyReservations(): void {
    this.problem.set(null);
    this.loading.set(true);

    forkJoin({
      reservations: this.reservationsFacade.listMyReservations(),
      hotels: this.hotelsFacade.listHotels().pipe(catchError(() => of([]))),
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ reservations, hotels }) => {
          this.reservations.set(reservations);
          this.hotels.set(toHotelDisplayMap(hotels));
        },
        error: (error: unknown) => {
          this.reservations.set([]);
          this.problem.set(toProblemDetail(error));
        },
      });
  }

  private matchesFilter(reservation: Reservation, filter: ReservationFilter): boolean {
    if (filter === 'all') {
      return true;
    }

    if (reservation.status === 'CANCELLED') {
      return filter === 'cancelled';
    }

    const past = this.isPastReservation(reservation);

    if (filter === 'past') {
      return past;
    }

    return !past;
  }

  private isPastReservation(reservation: Reservation): boolean {
    if (reservation.status === 'CHECKED_OUT' || reservation.status === 'NO_SHOW') {
      return true;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkOut = new Date(`${reservation.checkOut}T00:00:00`);

    return Number.isFinite(checkOut.getTime()) && checkOut < today;
  }

  private compareReservations(a: Reservation, b: Reservation, sort: ReservationSort): number {
    if (sort === 'checkInDesc') {
      return b.checkIn.localeCompare(a.checkIn);
    }

    if (sort === 'createdDesc') {
      return b.createdAt.localeCompare(a.createdAt);
    }

    return a.checkIn.localeCompare(b.checkIn);
  }
}

function toHotelDisplayMap(hotels: readonly Hotel[]): Record<number, ReservationHotelDisplay> {
  return hotels.reduce<Record<number, ReservationHotelDisplay>>((acc, hotel) => {
    acc[hotel.hotelId] = {
      name: hotel.name,
      location: [hotel.city, hotel.country].filter(Boolean).join(', '),
    };
    return acc;
  }, {});
}
