import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { toProblemDetail } from '../../../../core/http/api-error.util';
import { ProblemDetail } from '../../../../core/http/problem-detail.model';
import { ErrorMessage } from '../../../../shared/ui/error-message/error-message';
import { ReservationForm } from '../../components/reservation-form/reservation-form';
import { CreateReservationRequest, ReservationDisplayDetails } from '../../model/reservation.model';
import { ReservationsFacade } from '../../services/reservations.facade';

@Component({
  selector: 'app-create-reservation-page',
  imports: [ErrorMessage, ReservationForm],
  templateUrl: './create-reservation-page.html',
  styleUrl: './create-reservation-page.scss',
})
export class CreateReservationPage {
  private readonly reservations = inject(ReservationsFacade);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly saving = signal(false);
  protected readonly problem = signal<ProblemDetail | null>(null);
  protected readonly initialRequest = readInitialRequest(this.route);
  protected readonly displayDetails = readDisplayDetails(this.route);

  protected createReservation(request: CreateReservationRequest): void {
    this.problem.set(null);
    this.saving.set(true);

    this.reservations
      .createReservation(request)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (reservation) => {
          void this.router.navigate(['/reservations', reservation.reservationId]);
        },
        error: (error: unknown) => {
          this.problem.set(toProblemDetail(error));
        },
      });
  }
}

function readInitialRequest(route: ActivatedRoute): Partial<CreateReservationRequest> | null {
  const params = route.snapshot.queryParamMap;
  const hotelId = Number(params.get('hotelId'));
  const roomTypeId = Number(params.get('roomTypeId'));
  const guestCount = Number(params.get('guestCount'));
  const checkIn = params.get('checkIn') ?? '';
  const checkOut = params.get('checkOut') ?? '';

  const request: Partial<CreateReservationRequest> = {};

  if (Number.isFinite(hotelId) && hotelId > 0) {
    request.hotelId = hotelId;
  }
  if (Number.isFinite(roomTypeId) && roomTypeId > 0) {
    request.roomTypeId = roomTypeId;
  }
  if (Number.isFinite(guestCount) && guestCount > 0) {
    request.guestCount = guestCount;
  }
  if (checkIn) {
    request.checkIn = checkIn;
  }
  if (checkOut) {
    request.checkOut = checkOut;
  }

  return Object.keys(request).length ? request : null;
}

function readDisplayDetails(route: ActivatedRoute): ReservationDisplayDetails | null {
  const params = route.snapshot.queryParamMap;
  const hotelId = Number(params.get('hotelId'));
  const roomTypeId = Number(params.get('roomTypeId'));
  const hotelName = params.get('hotelName')?.trim() ?? '';
  const roomName = params.get('roomName')?.trim() ?? '';
  const location = params.get('location')?.trim() ?? '';

  if (!hotelName && !roomName && !location && !hotelId && !roomTypeId) {
    return null;
  }

  return {
    propertyName: hotelName || (hotelId > 0 ? `Property #${hotelId}` : 'Selected property'),
    roomName: roomName || (roomTypeId > 0 ? `Room option #${roomTypeId}` : 'Selected room'),
    location,
  };
}
