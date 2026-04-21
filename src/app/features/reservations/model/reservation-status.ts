export type ReservationStatus = 'PENDING' | 'CANCELLED';

export function isCancellableReservation(status: ReservationStatus): boolean {
  return status === 'PENDING';
}
