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
