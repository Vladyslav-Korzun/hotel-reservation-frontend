import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { Reservation } from '../../reservations/model/reservation.model';
import { toReservation } from '../../reservations/model/reservation.mapper';
import { StaffApi } from '../api/staff.api';
import { toRoomOperation } from '../model/room-operation.mapper';
import { RoomOperation, RoomOperationalStatus } from '../model/room-operation.model';

@Injectable({ providedIn: 'root' })
export class StaffFacade {
  private readonly api = inject(StaffApi);

  listReservations(): Observable<Reservation[]> {
    return this.api.listReservations().pipe(map((items) => items.map(toReservation)));
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

  updateRoomStatus(roomId: number, status: RoomOperationalStatus): Observable<RoomOperation> {
    return this.api.updateRoomStatus(roomId, { status }).pipe(map(toRoomOperation));
  }
}
