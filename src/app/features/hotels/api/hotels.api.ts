import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { HotelResponseDto, HotelServiceOfferingResponseDto, RoomTypeResponseDto } from './hotel.dto';

@Injectable({ providedIn: 'root' })
export class HotelsApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/hotels`;

  listHotels(): Observable<HotelResponseDto[]> {
    return this.http.get<HotelResponseDto[]>(this.baseUrl);
  }

  getHotel(hotelId: number): Observable<HotelResponseDto> {
    return this.http.get<HotelResponseDto>(`${this.baseUrl}/${encodeURIComponent(hotelId)}`);
  }

  listHotelServices(hotelId: number): Observable<HotelServiceOfferingResponseDto[]> {
    return this.http.get<HotelServiceOfferingResponseDto[]>(
      `${this.baseUrl}/${encodeURIComponent(hotelId)}/services`,
    );
  }

  listHotelRoomTypes(hotelId: number): Observable<RoomTypeResponseDto[]> {
    return this.http.get<RoomTypeResponseDto[]>(
      `${this.baseUrl}/${encodeURIComponent(hotelId)}/room-types`,
    );
  }
}
