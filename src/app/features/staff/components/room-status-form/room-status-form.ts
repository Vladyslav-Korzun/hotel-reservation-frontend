import { Component, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RoomOperationalStatus } from '../../model/room-operation.model';

export interface RoomStatusUpdate {
  roomId: number;
  status: RoomOperationalStatus;
}

@Component({
  selector: 'app-room-status-form',
  imports: [ReactiveFormsModule],
  templateUrl: './room-status-form.html',
  styleUrl: './room-status-form.scss',
})
export class RoomStatusForm {
  readonly submitting = input(false);
  readonly submitted = output<RoomStatusUpdate>();

  protected readonly statuses: readonly RoomOperationalStatus[] = [
    'AVAILABLE',
    'CLEANING',
    'MAINTENANCE',
    'OUT_OF_SERVICE',
  ];

  protected readonly form = new FormGroup({
    roomId: new FormControl<number | null>(null, [Validators.required, Validators.min(1)]),
    status: new FormControl<RoomOperationalStatus>('AVAILABLE', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  protected submit(): void {
    this.form.markAllAsTouched();

    if (this.form.invalid || this.submitting()) {
      return;
    }

    const value = this.form.getRawValue();
    this.submitted.emit({
      roomId: Number(value.roomId),
      status: value.status,
    });
  }

  protected hasError(controlName: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[controlName];
    return control.touched && control.invalid;
  }
}
