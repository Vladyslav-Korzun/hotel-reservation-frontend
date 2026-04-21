import { Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../../../core/auth/auth.service';
import { toProblemDetail } from '../../../../core/http/api-error.util';
import { ProblemDetail } from '../../../../core/http/problem-detail.model';
import { ErrorMessage } from '../../../../shared/ui/error-message/error-message';
import { LoadingState } from '../../../../shared/ui/loading-state/loading-state';
import { FindReservationForm } from '../../components/find-reservation-form/find-reservation-form';
import { Reservation } from '../../model/reservation.model';
import { ReservationList } from '../../components/reservation-list/reservation-list';
import { ReservationsFacade } from '../../services/reservations.facade';

@Component({
  selector: 'app-find-reservation-page',
  imports: [ReactiveFormsModule, ErrorMessage, LoadingState, FindReservationForm, ReservationList],
  templateUrl: './find-reservation-page.html',
  styleUrl: './find-reservation-page.scss',
})
export class FindReservationPage {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly reservationsFacade = inject(ReservationsFacade);

  protected readonly form = new FormGroup({
    reservationId: new FormControl('', { nonNullable: true }),
  });
  protected readonly loading = signal(false);
  protected readonly problem = signal<ProblemDetail | null>(null);
  protected readonly reservations = signal<Reservation[]>([]);
  protected readonly hasRequestedList = signal(false);
  protected readonly canViewAllReservations = computed(
    () => this.auth.hasAnyRole(['STAFF', 'ADMIN']) && this.auth.isAuthenticated(),
  );

  protected get reservationId(): FormControl<string> {
    return this.form.controls.reservationId;
  }

  protected openReservation(): void {
    const value = this.reservationId.value.trim();

    if (!value) {
      if (this.canViewAllReservations()) {
        this.loadAllReservations();
      }
      return;
    }

    this.problem.set(null);
    this.hasRequestedList.set(false);
    this.reservations.set([]);
    void this.router.navigate(['/reservations', value]);
  }

  protected showAllReservations(): void {
    if (!this.canViewAllReservations()) {
      return;
    }

    this.reservationId.setValue('');
    this.loadAllReservations();
  }

  private loadAllReservations(): void {
    this.hasRequestedList.set(true);
    this.problem.set(null);
    this.loading.set(true);

    this.reservationsFacade
      .listReservations()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (reservations) => this.reservations.set(reservations),
        error: (error: unknown) => {
          this.reservations.set([]);
          this.problem.set(toProblemDetail(error));
        },
      });
  }
}
