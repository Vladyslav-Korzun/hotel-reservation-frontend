import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { AvailableRoomResponseDto } from '../api/stay-search.dto';
import { StaysApi } from '../api/stays.api';
import { StayOption, StaySearchCriteria } from '../model/stay-search.model';

@Injectable({ providedIn: 'root' })
export class StaysFacade {
  private readonly api = inject(StaysApi);

  search(criteria: StaySearchCriteria): Observable<StayOption[]> {
    return this.api
      .searchAvailableRooms({
        city: criteria.destination,
        hotelId: criteria.hotelId ?? undefined,
        checkIn: criteria.checkIn,
        checkOut: criteria.checkOut,
        adults: criteria.adults,
        childrenAges: criteria.childrenAges,
        pets: criteria.pets,
      })
      .pipe(map((items) => items.map(toStayOption)));
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
  };
}
