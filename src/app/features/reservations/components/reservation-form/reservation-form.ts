import { Component, effect, input, output } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { CreateReservationRequest, ReservationDisplayDetails } from '../../model/reservation.model';

@Component({
  selector: 'app-reservation-form',
  imports: [ReactiveFormsModule],
  templateUrl: './reservation-form.html',
  styleUrl: './reservation-form.scss',
})
export class ReservationForm {
  readonly submitting = input(false);
  readonly initialValue = input<Partial<CreateReservationRequest> | null>(null);
  readonly displayDetails = input<ReservationDisplayDetails | null>(null);
  readonly submitted = output<CreateReservationRequest>();

  protected readonly form = new FormGroup(
    {
      hotelId: new FormControl<number | null>(null, [Validators.required, Validators.min(1)]),
      roomTypeId: new FormControl<number | null>(null, [Validators.required, Validators.min(1)]),
      checkIn: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      checkOut: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      guestCount: new FormControl<number | null>(1, [Validators.required, Validators.min(1)]),
    },
    { validators: [checkOutAfterCheckInValidator] },
  );

  constructor() {
    effect(() => {
      const initialValue = this.initialValue();

      if (initialValue) {
        this.form.patchValue(initialValue, { emitEvent: false });
      }
    });
  }

  protected submit(): void {
    this.form.markAllAsTouched();

    if (this.form.invalid || this.submitting()) {
      return;
    }

    const value = this.form.getRawValue();
    this.submitted.emit({
      hotelId: Number(value.hotelId),
      roomTypeId: Number(value.roomTypeId),
      checkIn: value.checkIn,
      checkOut: value.checkOut,
      guestCount: Number(value.guestCount),
    });
  }

  protected hasError(controlName: keyof typeof this.form.controls, error: string): boolean {
    const control = this.form.controls[controlName];
    return control.touched && control.hasError(error);
  }

  protected hasDateRangeError(): boolean {
    return this.form.touched && this.form.hasError('checkOutAfterCheckIn');
  }

  protected propertyLabel(): string {
    return this.displayDetails()?.propertyName || 'Selected property';
  }

  protected roomLabel(): string {
    return this.displayDetails()?.roomName || 'Selected room';
  }

  protected locationLabel(): string {
    return this.displayDetails()?.location || '';
  }
}

function checkOutAfterCheckInValidator(control: AbstractControl): ValidationErrors | null {
  const checkIn = control.get('checkIn')?.value;
  const checkOut = control.get('checkOut')?.value;

  if (!checkIn || !checkOut) {
    return null;
  }

  return checkOut > checkIn ? null : { checkOutAfterCheckIn: true };
}
