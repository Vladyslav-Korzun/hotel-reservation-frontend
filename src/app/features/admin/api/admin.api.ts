import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  CreateHotelRequestDto,
  CreateRoomRequestDto,
  CreateRoomTypeRequestDto,
  CreateServiceOfferingRequestDto,
  HotelResponseDto,
  HotelServiceOfferingResponseDto,
  RoomResponseDto,
  RoomTypeResponseDto,
  UpdateHotelRequestDto,
  UpdateRoomRequestDto,
  UpdateRoomTypeRequestDto,
  UpdateServiceOfferingRequestDto,
} from './admin.dto';

@Injectable({ providedIn: 'root' })
export class AdminApi {
  private readonly http = inject(HttpClient);

  createHotel(request: CreateHotelRequestDto): Observable<HotelResponseDto> {
    return this.http.post<HotelResponseDto>(`${environment.apiBaseUrl}/admin/hotels`, request);
  }

  updateHotel(hotelId: number, request: UpdateHotelRequestDto): Observable<HotelResponseDto> {
    return this.http.put<HotelResponseDto>(`${environment.apiBaseUrl}/admin/hotels/${hotelId}`, request);
  }

  createRoomType(request: CreateRoomTypeRequestDto): Observable<RoomTypeResponseDto> {
    return this.http.post<RoomTypeResponseDto>(`${environment.apiBaseUrl}/admin/room-types`, request);
  }

  updateRoomType(roomTypeId: number, request: UpdateRoomTypeRequestDto): Observable<RoomTypeResponseDto> {
    return this.http.put<RoomTypeResponseDto>(`${environment.apiBaseUrl}/admin/room-types/${roomTypeId}`, request);
  }

  createRoom(request: CreateRoomRequestDto): Observable<RoomResponseDto> {
    return this.http.post<RoomResponseDto>(`${environment.apiBaseUrl}/admin/rooms`, request);
  }

  updateRoom(roomId: number, request: UpdateRoomRequestDto): Observable<RoomResponseDto> {
    return this.http.put<RoomResponseDto>(`${environment.apiBaseUrl}/admin/rooms/${roomId}`, request);
  }

  createServiceOffering(
    hotelId: number,
    request: CreateServiceOfferingRequestDto,
  ): Observable<HotelServiceOfferingResponseDto> {
    return this.http.post<HotelServiceOfferingResponseDto>(
      `${environment.apiBaseUrl}/admin/hotels/${hotelId}/services`,
      request,
    );
  }

  updateServiceOffering(
    hotelId: number,
    serviceId: number,
    request: UpdateServiceOfferingRequestDto,
  ): Observable<HotelServiceOfferingResponseDto> {
    return this.http.put<HotelServiceOfferingResponseDto>(
      `${environment.apiBaseUrl}/admin/hotels/${hotelId}/services/${serviceId}`,
      request,
    );
  }

  deactivateServiceOffering(hotelId: number, serviceId: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiBaseUrl}/admin/hotels/${hotelId}/services/${serviceId}`);
  }
}
