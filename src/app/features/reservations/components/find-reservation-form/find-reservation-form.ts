import { Component, input, output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-find-reservation-form',
  imports: [ReactiveFormsModule],
  templateUrl: './find-reservation-form.html',
  styleUrl: './find-reservation-form.scss',
})
export class FindReservationForm {
  readonly form = input.required<FormGroup>();
  readonly canViewAllReservations = input(false);
  readonly submitted = output<void>();
  readonly showAllRequested = output<void>();
}
