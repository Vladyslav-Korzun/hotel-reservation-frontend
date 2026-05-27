import { Injectable, inject } from '@angular/core';
import { Observable, map, shareReplay } from 'rxjs';
import { AvailableRoomResponseDto } from '../api/stay-search.dto';
import { StaysApi } from '../api/stays.api';
import { RoomAvailabilityDay } from '../model/availability.model';
import { StayOption, StaySearchCriteria } from '../model/stay-search.model';

@Injectable({ providedIn: 'root' })
export class StaysFacade {
  private readonly api = inject(StaysApi);

  /** Cache: same search criteria returns the same observable. */
  private readonly searchCache = new Map<string, Observable<StayOption[]>>();

  /** Cache: same (hotelId, roomTypeId, from, to) returns the same observable. */
  private readonly availabilityCache = new Map<string, Observable<readonly RoomAvailabilityDay[]>>();

  search(criteria: StaySearchCriteria): Observable<StayOption[]> {
    const key = [
      criteria.destination,
      criteria.hotelId ?? '',
      criteria.checkIn,
      criteria.checkOut,
      criteria.adults,
      criteria.childrenAges.join(','),
      JSON.stringify(criteria.pets),
    ].join('|');

    const cached = this.searchCache.get(key);
    if (cached) return cached;

    const request$ = this.api
      .searchAvailableRooms({
        city: criteria.destination,
        hotelId: criteria.hotelId ?? undefined,
        checkIn: criteria.checkIn,
        checkOut: criteria.checkOut,
        adults: criteria.adults,
        childrenAges: criteria.childrenAges,
        pets: criteria.pets,
      })
      .pipe(
        map((items) => items.map(toStayOption)),
        shareReplay({ bufferSize: 1, refCount: false }),
      );

    this.searchCache.set(key, request$);
    return request$;
  }

  /**
   * Per-day availability for a room type within `[fromIso, toIso]` (max 90 days).
   * Cached by `(hotelId, roomTypeId, fromIso, toIso)` — repeated calls share the
   * same in-flight / completed request.
   */
  getAvailabilityCalendar(
    hotelId: number,
    roomTypeId: number,
    fromIso: string,
    toIso: string,
  ): Observable<readonly RoomAvailabilityDay[]> {
    const key = `${hotelId}|${roomTypeId}|${fromIso}|${toIso}`;
    const cached = this.availabilityCache.get(key);
    if (cached) return cached;

    const request$ = this.api
      .getAvailabilityCalendar(hotelId, roomTypeId, fromIso, toIso)
      .pipe(
        map((days) => days.map(toRoomAvailabilityDay)),
        shareReplay({ bufferSize: 1, refCount: false }),
      );

    this.availabilityCache.set(key, request$);
    return request$;
  }

  /** Drop cached availability windows (e.g. after a reservation conflict). */
  clearAvailabilityCache(hotelId?: number, roomTypeId?: number): void {
    if (hotelId === undefined && roomTypeId === undefined) {
      this.availabilityCache.clear();
      return;
    }
    const prefix = `${hotelId ?? ''}|${roomTypeId ?? ''}|`;
    for (const key of this.availabilityCache.keys()) {
      if (key.startsWith(prefix)) this.availabilityCache.delete(key);
    }
  }
}

function toStayOption(dto: AvailableRoomResponseDto): StayOption {
  return {
    hotelId: dto.hotelId,
    roomTypeId: dto.roomTypeId,
    hotelName: dto.hotelName,
    roomName: dto.roomTypeName,
    maxAdults: dto.maxAdults,
    maxChildren: dto.maxChildren,
    maxInfants: dto.maxInfants,
    maxTotalGuests: dto.maxTotalGuests,
    petsAllowed: dto.petsAllowed,
    maxPets: dto.maxPets,
    nightlyPrice: dto.basePriceAmount,
    currency: dto.basePriceCurrency,
    availableCount: dto.availableCount,
    bedSetup: dto.bedSetup?.trim() || null,
    roomSizeSqm: typeof dto.roomSizeSqm === 'number' && dto.roomSizeSqm > 0 ? dto.roomSizeSqm : null,
    amenities: dto.amenities ?? [],
  };
}

function toRoomAvailabilityDay(dto: {
  date: string;
  availableCount: number;
  available: boolean;
}): RoomAvailabilityDay {
  return {
    date: dto.date,
    availableCount: dto.availableCount,
    available: dto.available,
  };
}
