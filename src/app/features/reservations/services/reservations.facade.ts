import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ReservationsApi } from '../api/reservations.api';
import { ReservationResponseDto } from '../api/reservation.dto';
import { CreateReservationRequest, Reservation } from '../model/reservation.model';
import { ReservationStatus } from '../model/reservation-status';

@Injectable({ providedIn: 'root' })
export class ReservationsFacade {
  private readonly api = inject(ReservationsApi);

  listReservations(): Observable<Reservation[]> {
    return this.api.listReservations().pipe(map((items) => items.map(toReservation)));
  }

  createReservation(request: CreateReservationRequest): Observable<Reservation> {
    return this.api.createReservation(request).pipe(map(toReservation));
  }

  getReservation(reservationId: string): Observable<Reservation> {
    return this.api.getReservation(reservationId).pipe(map(toReservation));
  }

  cancelReservation(reservationId: string): Observable<void> {
    return this.api.cancelReservation(reservationId);
  }

  checkInReservation(reservationId: string): Observable<Reservation> {
    return this.api.checkInReservation(reservationId).pipe(map(toReservation));
  }

  checkOutReservation(reservationId: string): Observable<Reservation> {
    return this.api.checkOutReservation(reservationId).pipe(map(toReservation));
  }
}

function toReservation(dto: ReservationResponseDto): Reservation {
  return {
    reservationId: dto.reservationId,
    hotelId: dto.hotelId,
    roomId: dto.roomId ?? null,
    roomTypeId: dto.roomTypeId,
    checkIn: dto.checkIn,
    checkOut: dto.checkOut,
    adults: dto.adults,
    childrenAges: dto.childrenAges,
    pets: dto.pets,
    status: toReservationStatus(dto.status),
    createdAt: dto.createdAt,
    cancelledAt: dto.cancelledAt ?? null,
    createdBy: dto.createdBy,
  };
}

function toReservationStatus(status: string): ReservationStatus {
  if (
    status === 'PENDING' ||
    status === 'CONFIRMED' ||
    status === 'CANCELLED' ||
    status === 'CHECKED_IN' ||
    status === 'CHECKED_OUT' ||
    status === 'NO_SHOW'
  ) {
    return status;
  }

  throw new Error(`Unsupported reservation status: ${status}`);
}
