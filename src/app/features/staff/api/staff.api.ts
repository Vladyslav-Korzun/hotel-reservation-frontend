import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  RoomOperationResponseDto,
  StaffCreateReservationRequestDto,
  StaffReservationResponseDto,
  UpdateRoomStatusRequestDto,
} from './staff.dto';

@Injectable({ providedIn: 'root' })
export class StaffApi {
  private readonly http = inject(HttpClient);

  listReservations(limit = 100): Observable<StaffReservationResponseDto[]> {
    return this.http.get<StaffReservationResponseDto[]>(`${environment.apiBaseUrl}/reservations`, {
      params: { limit },
    });
  }

  listRooms(): Observable<RoomOperationResponseDto[]> {
    return this.http.get<RoomOperationResponseDto[]>(`${environment.apiBaseUrl}/staff/rooms`);
  }

  createReservation(request: StaffCreateReservationRequestDto): Observable<StaffReservationResponseDto> {
    return this.http.post<StaffReservationResponseDto>(`${environment.apiBaseUrl}/staff/reservations`, request);
  }

  checkInReservation(reservationId: string): Observable<StaffReservationResponseDto> {
    return this.http.post<StaffReservationResponseDto>(
      `${environment.apiBaseUrl}/staff/reservations/${encodeURIComponent(reservationId)}/check-in`,
      null,
    );
  }

  checkOutReservation(reservationId: string): Observable<StaffReservationResponseDto> {
    return this.http.post<StaffReservationResponseDto>(
      `${environment.apiBaseUrl}/staff/reservations/${encodeURIComponent(reservationId)}/check-out`,
      null,
    );
  }

  markNoShowReservation(reservationId: string): Observable<StaffReservationResponseDto> {
    return this.http.post<StaffReservationResponseDto>(
      `${environment.apiBaseUrl}/staff/reservations/${encodeURIComponent(reservationId)}/no-show`,
      null,
    );
  }

  updateRoomStatus(roomId: number, request: UpdateRoomStatusRequestDto): Observable<RoomOperationResponseDto> {
    return this.http.patch<RoomOperationResponseDto>(
      `${environment.apiBaseUrl}/staff/rooms/${encodeURIComponent(roomId)}/status`,
      request,
    );
  }
}
