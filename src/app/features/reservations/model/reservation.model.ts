import { AccommodationParty } from '../../../shared/accommodation/accommodation-party.model';
import { ReservationStatus } from './reservation-status';

export interface CreateReservationRequest extends AccommodationParty {
  hotelId: number;
  roomTypeId: number;
  checkIn: string;
  checkOut: string;
}

export interface ReservationDisplayDetails {
  propertyName: string;
  roomName: string;
  location: string;
}

export interface Reservation extends AccommodationParty {
  reservationId: string;
  hotelId: number;
  roomId: number | null;
  roomTypeId: number;
  checkIn: string;
  checkOut: string;
  status: ReservationStatus;
  createdAt: string;
  cancelledAt: string | null;
  createdBy: string;
}
