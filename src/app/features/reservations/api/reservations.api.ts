import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CreateReservationRequestDto, ReservationResponseDto } from './reservation.dto';

@Injectable({ providedIn: 'root' })
export class ReservationsApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/reservations`;

  listReservations(): Observable<ReservationResponseDto[]> {
    return this.http.get<ReservationResponseDto[]>(this.baseUrl);
  }

  listMyReservations(): Observable<ReservationResponseDto[]> {
    return this.http.get<ReservationResponseDto[]>(`${environment.apiBaseUrl}/me/reservations`);
  }

  createReservation(request: CreateReservationRequestDto): Observable<ReservationResponseDto> {
    return this.http.post<ReservationResponseDto>(this.baseUrl, request);
  }

  getReservation(reservationId: string): Observable<ReservationResponseDto> {
    return this.http.get<ReservationResponseDto>(`${this.baseUrl}/${encodeURIComponent(reservationId)}`);
  }

  cancelReservation(reservationId: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${encodeURIComponent(reservationId)}/cancel`, null);
  }

  checkInReservation(reservationId: string): Observable<ReservationResponseDto> {
    return this.http.post<ReservationResponseDto>(
      `${environment.apiBaseUrl}/staff/reservations/${encodeURIComponent(reservationId)}/check-in`,
      null,
    );
  }

  checkOutReservation(reservationId: string): Observable<ReservationResponseDto> {
    return this.http.post<ReservationResponseDto>(
      `${environment.apiBaseUrl}/staff/reservations/${encodeURIComponent(reservationId)}/check-out`,
      null,
    );
  }

  markNoShowReservation(reservationId: string): Observable<ReservationResponseDto> {
    return this.http.post<ReservationResponseDto>(
      `${environment.apiBaseUrl}/staff/reservations/${encodeURIComponent(reservationId)}/no-show`,
      null,
    );
  }
}
