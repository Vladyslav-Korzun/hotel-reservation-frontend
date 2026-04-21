import { Injectable } from '@angular/core';
import { StayOption, StaySearchCriteria } from '../model/stay-search.model';

const STAY_OPTIONS: readonly StayOption[] = [
  {
    hotelId: 1,
    roomTypeId: 1,
    hotelName: 'Stavanger Fjord House',
    roomName: 'Nordic Single',
    location: 'Stavanger, Norway',
    capacity: 1,
    nightlyPrice: 96,
    rating: 4.7,
    tags: ['Fjord view', 'Breakfast', 'Quiet'],
    description: 'Compact room for solo stays close to the harbour.',
  },
  {
    hotelId: 1,
    roomTypeId: 2,
    hotelName: 'Stavanger Fjord House',
    roomName: 'Fjord Double',
    location: 'Stavanger, Norway',
    capacity: 2,
    nightlyPrice: 148,
    rating: 4.8,
    tags: ['Sea view', 'Queen bed', 'Workspace'],
    description: 'Balanced option for guests who need comfort and a clean booking flow.',
  },
  {
    hotelId: 2,
    roomTypeId: 3,
    hotelName: 'Bergen Harbor Suites',
    roomName: 'Harbor Studio',
    location: 'Bergen, Norway',
    capacity: 3,
    nightlyPrice: 172,
    rating: 4.6,
    tags: ['Kitchenette', 'Harbor', 'Family'],
    description: 'Studio room for longer stays and small groups.',
  },
  {
    hotelId: 3,
    roomTypeId: 4,
    hotelName: 'Oslo Northline Hotel',
    roomName: 'Executive Loft',
    location: 'Oslo, Norway',
    capacity: 4,
    nightlyPrice: 224,
    rating: 4.9,
    tags: ['Premium', 'City center', 'Lounge'],
    description: 'Large room type for guests who want a premium city stay.',
  },
];

@Injectable({ providedIn: 'root' })
export class StayCatalogService {
  search(criteria: StaySearchCriteria): readonly StayOption[] {
    const destination = criteria.destination.trim().toLowerCase();

    return STAY_OPTIONS.filter((option) => {
      const matchesDestination =
        !destination ||
        option.location.toLowerCase().includes(destination) ||
        option.hotelName.toLowerCase().includes(destination);

      return matchesDestination && option.capacity >= criteria.guests;
    });
  }
}

