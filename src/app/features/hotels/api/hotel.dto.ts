import type { components } from '../../../core/api/generated/hotel-reservation.types';

export type HotelResponseDto = components['schemas']['HotelResponse'];
export type HotelServiceOfferingResponseDto = components['schemas']['HotelServiceOfferingResponse'];

/** Shared enum of room amenity codes. Frontend maps each code to label + icon. */
export type RoomAmenityCodeDto = components['schemas']['RoomAmenityCode'];

export type RoomTypeResponseDto = components['schemas']['RoomTypeResponse'];
export type CreateRoomTypeRequestDto = components['schemas']['CreateRoomTypeRequest'];
export type UpdateRoomTypeRequestDto = components['schemas']['UpdateRoomTypeRequest'];
