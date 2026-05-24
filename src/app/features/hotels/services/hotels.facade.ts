import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { HotelsApi } from '../api/hotels.api';
import { toHotel, toHotelRoomType, toHotelServiceOffering } from '../model/hotel.mapper';
import { Hotel, HotelFilters, HotelRoomType, HotelServiceOffering } from '../model/hotel.model';

@Injectable({ providedIn: 'root' })
export class HotelsFacade {
  private readonly api = inject(HotelsApi);

  listHotels(filters: Partial<HotelFilters> = {}): Observable<Hotel[]> {
    return this.api.listHotels(filters.city).pipe(map((items) => items.map(toHotel)));
  }

  getHotelDetails(hotelId: number): Observable<Hotel> {
    return this.api.getHotel(hotelId).pipe(map(toHotel));
  }

  getHotelServices(hotelId: number): Observable<HotelServiceOffering[]> {
    return this.api.listHotelServices(hotelId).pipe(map((items) => items.map(toHotelServiceOffering)));
  }

  getHotelRoomTypes(hotelId: number): Observable<HotelRoomType[]> {
    return this.api.listHotelRoomTypes(hotelId).pipe(map((items) => items.map(toHotelRoomType)));
  }
}
