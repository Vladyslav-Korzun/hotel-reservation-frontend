import { CreateReservationRequestDto, ReservationResponseDto } from '../api/reservation.dto';
import { CreateReservationRequest, Reservation, ReservationStatus } from './reservation.model';

export function toCreateReservationRequestDto(request: CreateReservationRequest): CreateReservationRequestDto {
  return {
    hotelId: request.hotelId,
    roomTypeId: request.roomTypeId,
    checkIn: request.checkIn,
    checkOut: request.checkOut,
    stayingGuests: request.stayingGuests,
    pets: request.pets,
    serviceOfferings: request.serviceOfferings,
    contactEmail: request.contactEmail,
    contactPhone: request.contactPhone,
    specialRequests: request.specialRequests,
  };
}

export function toReservation(dto: ReservationResponseDto): Reservation {
  return {
    reservationId: dto.reservationId,
    hotelId: dto.hotelId,
    guestId: dto.guestId,
    roomId: dto.roomId ?? null,
    roomTypeId: dto.roomTypeId,
    checkIn: dto.checkIn,
    checkOut: dto.checkOut,
    adults: dto.adults,
    childrenAges: dto.childrenAges,
    stayingGuests: dto.stayingGuests ?? [],
    pets: dto.pets,
    status: toReservationStatus(dto.status),
    createdAt: dto.createdAt,
    cancelledAt: dto.cancelledAt ?? null,
    createdBy: dto.createdBy,
    basePriceAmount: dto.basePriceAmount ?? null,
    basePriceCurrency: dto.basePriceCurrency ?? null,
    servicesPriceAmount: dto.servicesPriceAmount ?? null,
    servicesPriceCurrency: dto.servicesPriceCurrency ?? null,
    discountAmount: dto.discountAmount ?? null,
    discountCurrency: dto.discountCurrency ?? null,
    finalPriceAmount: dto.finalPriceAmount ?? null,
    finalPriceCurrency: dto.finalPriceCurrency ?? null,
    serviceItems: (dto.serviceItems ?? []).map((item) => ({
      serviceOfferingId: item.serviceOfferingId,
      serviceName: item.serviceName,
      priceAmount: item.priceAmount,
      priceCurrency: item.priceCurrency,
      quantity: item.quantity,
      totalPriceAmount: item.totalPriceAmount,
      totalPriceCurrency: item.totalPriceCurrency,
    })),
    contactEmail: dto.contactEmail?.trim() || null,
    contactPhone: dto.contactPhone?.trim() || null,
    specialRequests: dto.specialRequests?.trim() || null,
  };
}

function toReservationStatus(status: string): ReservationStatus {
  if (
    status === 'PENDING' ||
    status === 'CONFIRMED' ||
    status === 'CANCELLED' ||
    status === 'CHECKED_IN' ||
    status === 'CHECKED_OUT' ||
    status === 'NO_SHOW'
  ) {
    return status;
  }

  throw new Error(`Unsupported reservation status: ${status}`);
}
