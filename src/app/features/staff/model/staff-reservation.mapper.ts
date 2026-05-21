import { StaffCreateReservationRequestDto } from '../api/staff.dto';
import { StaffCreateReservationRequest } from './staff-reservation.model';

export function toStaffCreateReservationRequestDto(
  request: StaffCreateReservationRequest,
): StaffCreateReservationRequestDto {
  return {
    hotelId: request.hotelId,
    roomTypeId: request.roomTypeId,
    firstName: request.firstName,
    lastName: request.lastName,
    email: request.email,
    phone: request.phone,
    checkIn: request.checkIn,
    checkOut: request.checkOut,
    stayingGuests: request.stayingGuests,
    serviceOfferings: request.serviceOfferings,
  };
}
