import { Hotel, HotelServiceOffering } from '../../hotels/model/hotel.model';

export type AdminHotel = Hotel;
export type AdminServiceOffering = HotelServiceOffering;

export type AdminPetType = 'DOG' | 'CAT' | 'OTHER';
export type AdminRoomStatus = 'AVAILABLE' | 'CLEANING' | 'MAINTENANCE' | 'OUT_OF_SERVICE';
export type AdminRoomAmenityCode =
  | 'WIFI'
  | 'AIR_CONDITIONING'
  | 'HEATING'
  | 'PRIVATE_BATHROOM'
  | 'BATHTUB'
  | 'SHOWER'
  | 'HAIRDRYER'
  | 'SAFE'
  | 'MINIBAR'
  | 'COFFEE_MACHINE'
  | 'SMART_TV'
  | 'SOUNDPROOFING'
  | 'BALCONY'
  | 'SEA_VIEW'
  | 'CITY_VIEW'
  | 'MOUNTAIN_VIEW'
  | 'WORKSPACE'
  | 'WHEELCHAIR_ACCESSIBLE';

export interface AdminRoomType {
  roomTypeId: number;
  hotelId: number;
  name: string;
  maxAdults: number;
  maxChildren: number;
  maxInfants: number;
  maxTotalGuests: number;
  petsAllowed: boolean;
  maxPets: number;
  allowedPetTypes: AdminPetType[];
  maxPetWeightKg: number | null;
  petFeeAmount: number | null;
  petFeeCurrency: string | null;
  basePriceAmount: number;
  basePriceCurrency: string;
  description: string;
  bedSetup: string | null;
  roomSizeSqm: number | null;
  amenities: AdminRoomAmenityCode[];
}

export interface AdminRoom {
  roomId: number;
  hotelId: number;
  roomNumber: string;
  roomTypeId: number;
  capacity: number;
  status: AdminRoomStatus;
}

export interface AdminStaff {
  id: number;
  externalId: string;
  hotelId: number | null;
  username: string | null;
  email: string | null;
}
