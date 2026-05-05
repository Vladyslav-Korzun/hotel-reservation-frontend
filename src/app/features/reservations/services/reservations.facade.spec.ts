import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';
import { ReservationsApi } from '../api/reservations.api';
import { ReservationResponseDto } from '../api/reservation.dto';
import { ReservationsFacade } from './reservations.facade';

describe('ReservationsFacade', () => {
  it('maps reservation dto to domain model', async () => {
    const apiMock = {
      createReservation: () => of(createReservationDto({ status: 'PENDING', cancelledAt: null })),
      getReservation: () => of(createReservationDto({ status: 'PENDING', cancelledAt: null })),
      cancelReservation: () => of(void 0),
      listReservations: () => of([]),
    };

    TestBed.configureTestingModule({
      providers: [
        ReservationsFacade,
        { provide: ReservationsApi, useValue: apiMock },
      ],
    });

    const facade = TestBed.inject(ReservationsFacade);

    const reservation = await firstValueFrom(
      facade.getReservation('af884cad-7b10-4e17-ad82-551a23020ffe'),
    );

    expect(reservation.status).toBe('PENDING');
    expect(reservation.roomId).toBeNull();
    expect(reservation.cancelledAt).toBeNull();
  });

  it('maps supported backend reservation statuses', async () => {
    const apiMock = {
      createReservation: () => of(createReservationDto({ status: 'CHECKED_IN', roomId: 301, cancelledAt: null })),
      getReservation: () => of(createReservationDto({ status: 'CONFIRMED', cancelledAt: null })),
      cancelReservation: () => of(void 0),
      listReservations: () => of([]),
    };

    TestBed.configureTestingModule({
      providers: [
        ReservationsFacade,
        { provide: ReservationsApi, useValue: apiMock },
      ],
    });

    const facade = TestBed.inject(ReservationsFacade);
    const reservation = await firstValueFrom(
      facade.getReservation('af884cad-7b10-4e17-ad82-551a23020ffe'),
    );
    const checkedInReservation = await firstValueFrom(
      facade.createReservation({
        hotelId: 1,
        roomTypeId: 2,
        checkIn: '2026-05-10',
        checkOut: '2026-05-12',
        guestCount: 2,
      }),
    );

    expect(reservation.status).toBe('CONFIRMED');
    expect(checkedInReservation.status).toBe('CHECKED_IN');
    expect(checkedInReservation.roomId).toBe(301);
  });
});

function createReservationDto(override: Partial<ReservationResponseDto>): ReservationResponseDto {
  return {
    reservationId: 'af884cad-7b10-4e17-ad82-551a23020ffe',
    hotelId: 1,
    roomId: null,
    roomTypeId: 2,
    checkIn: '2026-05-10',
    checkOut: '2026-05-12',
    guestCount: 2,
    status: 'PENDING',
    createdAt: '2026-04-07T20:15:30Z',
    cancelledAt: null,
    createdBy: 'guest1',
    ...override,
  };
}
