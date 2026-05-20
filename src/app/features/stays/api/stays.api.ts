import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { RoomAvailabilityDayDto } from './availability.dto';
import { AvailableRoomResponseDto, SearchAvailableRoomsRequestDto } from './stay-search.dto';

@Injectable({ providedIn: 'root' })
export class StaysApi {
  private readonly http = inject(HttpClient);
  private readonly searchUrl = `${environment.apiBaseUrl}/rooms/search`;
  private readonly hotelsUrl = `${environment.apiBaseUrl}/hotels`;

  searchAvailableRooms(request: SearchAvailableRoomsRequestDto): Observable<AvailableRoomResponseDto[]> {
    const body: SearchAvailableRoomsRequestDto = {
      city: request.city?.trim() || undefined,
      hotelId: request.hotelId,
      checkIn: request.checkIn,
      checkOut: request.checkOut,
      adults: request.adults,
      childrenAges: request.childrenAges,
      pets: request.pets,
    };

    return this.http.post<AvailableRoomResponseDto[]>(this.searchUrl, body);
  }

  /**
   * Public endpoint — returns per-day availability for a room type
   * within `[from, to]` inclusive (max 90 days enforced by backend).
   */
  getAvailabilityCalendar(
    hotelId: number,
    roomTypeId: number,
    fromIso: string,
    toIso: string,
  ): Observable<RoomAvailabilityDayDto[]> {
    const url = `${this.hotelsUrl}/${hotelId}/room-types/${roomTypeId}/availability-calendar`;
    const params = new HttpParams().set('from', fromIso).set('to', toIso);
    return this.http.get<RoomAvailabilityDayDto[]>(url, { params });
  }
}
