import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { HotelsApi } from '../api/hotels.api';
import { toHotel, toHotelServiceOffering } from '../model/hotel.mapper';
import { Hotel, HotelFilters, HotelServiceOffering } from '../model/hotel.model';

@Injectable({ providedIn: 'root' })
export class HotelsFacade {
  private readonly api = inject(HotelsApi);

  listHotels(filters: Partial<HotelFilters> = {}): Observable<Hotel[]> {
    return this.api.listHotels().pipe(map((items) => filterHotels(items.map(toHotel), filters)));
  }

  getHotelDetails(hotelId: number): Observable<Hotel> {
    return this.api.getHotel(hotelId).pipe(map(toHotel));
  }

  getHotelServices(hotelId: number): Observable<HotelServiceOffering[]> {
    return this.api.listHotelServices(hotelId).pipe(map((items) => items.map(toHotelServiceOffering)));
  }
}

function filterHotels(hotels: readonly Hotel[], filters: Partial<HotelFilters>): Hotel[] {
  const city = filters.city?.trim().toLowerCase();

  if (!city) {
    return [...hotels];
  }

  return hotels.filter((hotel) => hotel.city.toLowerCase().includes(city));
}
