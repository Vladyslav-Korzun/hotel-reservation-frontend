import { Injectable, inject } from '@angular/core';
import { Observable, map, shareReplay } from 'rxjs';
import { HotelsApi } from '../api/hotels.api';
import { toHotel, toHotelRoomType, toHotelServiceOffering } from '../model/hotel.mapper';
import { Hotel, HotelFilters, HotelRoomType, HotelServiceOffering } from '../model/hotel.model';

@Injectable({ providedIn: 'root' })
export class HotelsFacade {
  private readonly api = inject(HotelsApi);
  private readonly listCache = new Map<string, Observable<Hotel[]>>();

  hasHotelsCache(city: string = ''): boolean {
    return this.listCache.has(city.toLowerCase().trim());
  }

  listHotels(filters: Partial<HotelFilters> = {}): Observable<Hotel[]> {
    const key = filters.city?.toLowerCase().trim() ?? '';
    const cached = this.listCache.get(key);
    if (cached) return cached;

    const request$ = this.api.listHotels(filters.city).pipe(
      map((items) => items.map(toHotel)),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
    this.listCache.set(key, request$);
    return request$;
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
