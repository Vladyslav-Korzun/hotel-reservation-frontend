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
}

function toReservation(dto: ReservationResponseDto): Reservation {
  return {
    reservationId: dto.reservationId,
    hotelId: dto.hotelId,
    roomTypeId: dto.roomTypeId,
    checkIn: dto.checkIn,
    checkOut: dto.checkOut,
    guestCount: dto.guestCount,
    status: toReservationStatus(dto.status),
    createdAt: dto.createdAt,
    cancelledAt: dto.cancelledAt ?? null,
    createdBy: dto.createdBy,
  };
}

function toReservationStatus(status: string): ReservationStatus {
  if (status === 'PENDING' || status === 'CANCELLED') {
    return status;
  }

  throw new Error(`Unsupported reservation status: ${status}`);
}
