import { HotelResponseDto, HotelServiceOfferingResponseDto } from '../api/hotel.dto';
import { Hotel, HotelServiceOffering, HotelStatus } from './hotel.model';

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
    // TODO(backend): once HotelResponseDto exposes `adultEquivalentAge`, drop the fallback.
    adultEquivalentAge: (dto as { adultEquivalentAge?: number }).adultEquivalentAge ?? 13,
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

function toHotelStatus(status: HotelResponseDto['status']): HotelStatus {
  return status;
}
