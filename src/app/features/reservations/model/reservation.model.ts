import { AccommodationParty, BookingPet } from '../../../shared/accommodation/accommodation-party.model';

export type ReservationStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'NO_SHOW';

export function isCancellableReservation(status: ReservationStatus): boolean {
  return status === 'PENDING' || status === 'CONFIRMED';
}

export function isCheckInAllowedReservation(status: ReservationStatus): boolean {
  return status === 'PENDING' || status === 'CONFIRMED';
}

export function isCheckOutAllowedReservation(status: ReservationStatus): boolean {
  return status === 'CHECKED_IN';
}

export interface CreateReservationRequest {
  hotelId: number;
  roomTypeId: number;
  checkIn: string;
  checkOut: string;
  stayingGuests: StayingGuest[];
  pets?: BookingPet[];
  serviceOfferings?: ReservationServiceSelection[];
  /** Per-booking override of profile email. Null → backend uses Guest.email. */
  contactEmail?: string | null;
  /** Per-booking phone. Null → backend uses Guest.phone if present. */
  contactPhone?: string | null;
  /** Free-form note to the hotel (early check-in, allergies, etc.). Max 500 chars. */
  specialRequests?: string | null;
}

export interface PublicCreateReservationRequest {
  hotelId: number;
  roomTypeId: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  checkIn: string;
  checkOut: string;
  stayingGuests: StayingGuest[];
  pets?: BookingPet[];
  serviceOfferings?: ReservationServiceSelection[];
}

export interface StayingGuest {
  firstName: string;
  lastName: string;
  age: number;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
}

export interface ReservationServiceSelection {
  serviceOfferingId: number;
  quantity: number;
}

export interface ReservationDisplayDetails {
  propertyName: string;
  roomName: string;
  location: string;
}

export interface Reservation extends AccommodationParty {
  reservationId: string;
  hotelId: number;
  guestId: number;
  roomId: number | null;
  roomTypeId: number;
  checkIn: string;
  checkOut: string;
  stayingGuests: StayingGuest[];
  status: ReservationStatus;
  createdAt: string;
  cancelledAt: string | null;
  createdBy: string;
  basePriceAmount: number | null;
  basePriceCurrency: string | null;
  servicesPriceAmount: number | null;
  servicesPriceCurrency: string | null;
  discountAmount: number | null;
  discountCurrency: string | null;
  finalPriceAmount: number | null;
  finalPriceCurrency: string | null;
  serviceItems: ReservationServiceItem[];
  /** Snapshot taken at booking time — may differ from current Guest profile. */
  contactEmail: string | null;
  contactPhone: string | null;
  specialRequests: string | null;
}

export interface ReservationServiceItem {
  serviceOfferingId: number;
  serviceName: string;
  priceAmount: number;
  priceCurrency: string;
  quantity: number;
  totalPriceAmount: number;
  totalPriceCurrency: string;
}
