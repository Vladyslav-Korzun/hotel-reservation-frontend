import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import {
  CreateHotelRequestDto,
  CreateRoomRequestDto,
  CreateRoomTypeRequestDto,
  CreateServiceOfferingRequestDto,
  UpdateHotelRequestDto,
  UpdateRoomRequestDto,
  UpdateRoomTypeRequestDto,
  UpdateServiceOfferingRequestDto,
} from '../api/admin.dto';
import { AdminApi } from '../api/admin.api';
import {
  toAdminHotel,
  toAdminRoom,
  toAdminRoomType,
  toAdminServiceOffering,
} from '../model/admin.mapper';
import { AdminHotel, AdminRoom, AdminRoomType, AdminServiceOffering } from '../model/admin.model';

@Injectable({ providedIn: 'root' })
export class AdminFacade {
  private readonly api = inject(AdminApi);

  createHotel(request: CreateHotelRequestDto): Observable<AdminHotel> {
    return this.api.createHotel(request).pipe(map(toAdminHotel));
  }

  updateHotel(hotelId: number, request: UpdateHotelRequestDto): Observable<AdminHotel> {
    return this.api.updateHotel(hotelId, request).pipe(map(toAdminHotel));
  }

  createRoomType(request: CreateRoomTypeRequestDto): Observable<AdminRoomType> {
    return this.api.createRoomType(request).pipe(map(toAdminRoomType));
  }

  updateRoomType(roomTypeId: number, request: UpdateRoomTypeRequestDto): Observable<AdminRoomType> {
    return this.api.updateRoomType(roomTypeId, request).pipe(map(toAdminRoomType));
  }

  createRoom(request: CreateRoomRequestDto): Observable<AdminRoom> {
    return this.api.createRoom(request).pipe(map(toAdminRoom));
  }

  updateRoom(roomId: number, request: UpdateRoomRequestDto): Observable<AdminRoom> {
    return this.api.updateRoom(roomId, request).pipe(map(toAdminRoom));
  }

  createServiceOffering(
    hotelId: number,
    request: CreateServiceOfferingRequestDto,
  ): Observable<AdminServiceOffering> {
    return this.api.createServiceOffering(hotelId, request).pipe(map(toAdminServiceOffering));
  }

  updateServiceOffering(
    hotelId: number,
    serviceId: number,
    request: UpdateServiceOfferingRequestDto,
  ): Observable<AdminServiceOffering> {
    return this.api.updateServiceOffering(hotelId, serviceId, request).pipe(map(toAdminServiceOffering));
  }

  deactivateServiceOffering(hotelId: number, serviceId: number): Observable<void> {
    return this.api.deactivateServiceOffering(hotelId, serviceId);
  }
}
