import {
  HotelResponseDto,
  HotelServiceOfferingResponseDto,
  RoomResponseDto,
  RoomTypeResponseDto,
} from '../api/admin.dto';
import { toHotel, toHotelServiceOffering } from '../../hotels/model/hotel.mapper';
import { AdminHotel, AdminRoom, AdminRoomStatus, AdminRoomType, AdminServiceOffering } from './admin.model';

export function toAdminHotel(dto: HotelResponseDto): AdminHotel {
  return toHotel(dto);
}

export function toAdminRoomType(dto: RoomTypeResponseDto): AdminRoomType {
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
    allowedPetTypes: dto.allowedPetTypes,
    maxPetWeightKg: dto.maxPetWeightKg ?? null,
    petFeeAmount: dto.petFeeAmount ?? null,
    petFeeCurrency: dto.petFeeCurrency ?? null,
    basePriceAmount: dto.basePriceAmount,
    basePriceCurrency: dto.basePriceCurrency,
    description: dto.description ?? '',
    bedSetup: dto.bedSetup ?? null,
    roomSizeSqm: dto.roomSizeSqm ?? null,
    amenities: dto.amenities ?? [],
  };
}

export function toAdminRoom(dto: RoomResponseDto): AdminRoom {
  return {
    roomId: dto.roomId,
    hotelId: dto.hotelId,
    roomNumber: dto.roomNumber,
    roomTypeId: dto.roomTypeId,
    capacity: dto.capacity,
    status: toAdminRoomStatus(dto.status),
  };
}

export function toAdminServiceOffering(dto: HotelServiceOfferingResponseDto): AdminServiceOffering {
  return toHotelServiceOffering(dto);
}

function toAdminRoomStatus(status: RoomResponseDto['status']): AdminRoomStatus {
  return status;
}
