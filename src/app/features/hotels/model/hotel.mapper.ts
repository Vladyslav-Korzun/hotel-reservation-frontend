import { HotelResponseDto, HotelServiceOfferingResponseDto, RoomTypeResponseDto } from '../api/hotel.dto';
import { Hotel, HotelRoomType, HotelServiceOffering, HotelStatus } from './hotel.model';

export function toHotel(dto: HotelResponseDto): Hotel {
  return {
    hotelId: dto.hotelId,
    name: dto.name,
    city: dto.city,
    country: dto.country,
    address: dto.address,
    stars: dto.stars,
    description: dto.description ?? '',
    status: toHotelStatus(dto.status),
    childrenAllowed: dto.childrenAllowed,
    petsAllowed: dto.petsAllowed,
    infantMaxAge: dto.infantMaxAge,
    childMaxAge: dto.childMaxAge,
    adultEquivalentAge: dto.adultEquivalentAge,
  };
}

export function toHotelServiceOffering(dto: HotelServiceOfferingResponseDto): HotelServiceOffering {
  return {
    serviceOfferingId: dto.serviceOfferingId,
    hotelId: dto.hotelId,
    code: dto.code,
    name: dto.name,
    description: dto.description ?? '',
    priceAmount: dto.priceAmount,
    priceCurrency: dto.priceCurrency,
    active: dto.active,
    availabilityRule: dto.availabilityRule ?? '',
  };
}

export function toHotelRoomType(dto: RoomTypeResponseDto): HotelRoomType {
  return {
    roomTypeId: dto.roomTypeId,
    hotelId: dto.hotelId,
    name: dto.name,
    maxAdults: dto.maxAdults,
    maxChildren: dto.maxChildren,
    maxInfants: dto.maxInfants,
    maxTotalGuests: dto.maxTotalGuests,
    petsAllowed: dto.petsAllowed,
    maxPets: dto.maxPets,
    basePriceAmount: dto.basePriceAmount,
    basePriceCurrency: dto.basePriceCurrency,
    description: dto.description ?? '',
    bedSetup: dto.bedSetup ?? null,
    roomSizeSqm: dto.roomSizeSqm ?? null,
  };
}

function toHotelStatus(status: HotelResponseDto['status']): HotelStatus {
  return status;
}
