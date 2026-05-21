import { ReservationServiceSelection, StayingGuest } from '../../reservations/model/reservation.model';

export interface StaffCreateReservationRequest {
  hotelId: number;
  roomTypeId: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  checkIn: string;
  checkOut: string;
  stayingGuests: StayingGuest[];
  serviceOfferings?: ReservationServiceSelection[];
}
