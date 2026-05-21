import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ReservationsApi } from '../api/reservations.api';
import {
  CreateReservationRequest,
  PublicCreateReservationRequest,
  Reservation,
} from '../model/reservation.model';
import {
  toCreateReservationRequestDto,
  toPublicCreateReservationRequestDto,
  toReservation,
} from '../model/reservation.mapper';

@Injectable({ providedIn: 'root' })
export class ReservationsFacade {
  private readonly api = inject(ReservationsApi);

  listReservations(): Observable<Reservation[]> {
    return this.api.listReservations().pipe(map((items) => items.map(toReservation)));
  }

  listMyReservations(): Observable<Reservation[]> {
    return this.api.listMyReservations().pipe(map((items) => items.map(toReservation)));
  }

  createReservation(request: CreateReservationRequest): Observable<Reservation> {
    return this.api.createReservation(toCreateReservationRequestDto(request)).pipe(map(toReservation));
  }

  createPublicReservation(request: PublicCreateReservationRequest): Observable<Reservation> {
    return this.api.createPublicReservation(toPublicCreateReservationRequestDto(request)).pipe(map(toReservation));
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

  markNoShowReservation(reservationId: string): Observable<Reservation> {
    return this.api.markNoShowReservation(reservationId).pipe(map(toReservation));
  }
}
