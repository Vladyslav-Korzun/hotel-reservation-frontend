import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AccommodationParty } from '../../../shared/accommodation/accommodation-party.model';
import { AvailableRoomResponseDto } from './stay-search.dto';

export interface SearchAvailableRoomsRequest extends AccommodationParty {
  city?: string;
  hotelId?: number;
  checkIn: string;
  checkOut: string;
}

@Injectable({ providedIn: 'root' })
export class StaysApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/rooms/search`;

  searchAvailableRooms(request: SearchAvailableRoomsRequest): Observable<AvailableRoomResponseDto[]> {
    return this.http.post<AvailableRoomResponseDto[]>(this.baseUrl, {
      city: request.city?.trim() || undefined,
      hotelId: request.hotelId,
      checkIn: request.checkIn,
      checkOut: request.checkOut,
      adults: request.adults,
      childrenAges: request.childrenAges,
      pets: request.pets,
    });
  }
}
