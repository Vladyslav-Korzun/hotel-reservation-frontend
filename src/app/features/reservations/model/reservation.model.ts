import { ReservationStatus } from './reservation-status';

export interface CreateReservationRequest {
  hotelId: number;
  roomTypeId: number;
  checkIn: string;
  checkOut: string;
  guestCount: number;
}

export interface ReservationDisplayDetails {
  propertyName: string;
  roomName: string;
  location: string;
}

export interface Reservation {
  reservationId: string;
  hotelId: number;
  roomTypeId: number;
  checkIn: string;
  checkOut: string;
  guestCount: number;
  status: ReservationStatus;
  createdAt: string;
  cancelledAt: string | null;
  createdBy: string;
}
