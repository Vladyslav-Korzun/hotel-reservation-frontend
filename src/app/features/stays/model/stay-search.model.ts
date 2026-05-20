import { AccommodationParty } from '../../../shared/accommodation/accommodation-party.model';
import { RoomAmenityCodeDto } from '../../hotels/api/hotel.dto';

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
  /** Human-readable bed configuration, e.g. "1 king bed". `null` when unknown. */
  bedSetup: string | null;
  /** Room floor area in square metres. `null` when unknown. */
  roomSizeSqm: number | null;
  /** Stable enum codes — frontend maps each to icon + label. Empty if none. */
  amenities: RoomAmenityCodeDto[];
}
