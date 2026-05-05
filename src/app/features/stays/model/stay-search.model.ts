import { AccommodationParty } from '../../../shared/accommodation/accommodation-party.model';

export interface StaySearchCriteria extends AccommodationParty {
  destination: string;
  hotelId: number | null;
  checkIn: string;
  checkOut: string;
}

export interface StayOption {
  hotelId: number;
  roomTypeId: number;
  hotelName: string;
  roomName: string;
  maxAdults: number;
  maxChildren: number;
  maxInfants: number;
  maxTotalGuests: number;
  petsAllowed: boolean;
  maxPets: number;
  nightlyPrice: number;
  currency: string;
  availableCount: number;
}
