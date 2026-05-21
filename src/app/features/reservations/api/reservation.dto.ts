import type { components } from '../../../core/api/generated/hotel-reservation.types';

export type CreateReservationRequestDto = components['schemas']['CreateReservationRequest'];
export type PublicCreateReservationRequestDto = components['schemas']['PublicCreateReservationRequest'];
export type ReservationResponseDto = components['schemas']['ReservationResponse'];
export type ReservationListResponseDto = ReservationResponseDto[];
