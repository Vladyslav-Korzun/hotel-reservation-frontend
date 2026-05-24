import { Component, effect, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RoomOperation, RoomOperationalStatus } from '../../model/room-operation.model';

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
  readonly room = input<RoomOperation | null>(null);
  readonly submitting = input(false);
  readonly submitted = output<RoomStatusUpdate>();

  protected readonly statuses: readonly RoomOperationalStatus[] = [
    'AVAILABLE',
    'CLEANING',
    'MAINTENANCE',
    'OUT_OF_SERVICE',
  ];

  protected readonly form = new FormGroup({
    status: new FormControl<RoomOperationalStatus>('AVAILABLE', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  private readonly syncRoomStatus = effect(() => {
    const room = this.room();
    if (!room || room.status === 'OCCUPIED') return;

    this.form.controls.status.setValue(room.status, { emitEvent: false });
  });

  protected submit(): void {
    const room = this.room();
    this.form.markAllAsTouched();

    if (!room || room.status === 'OCCUPIED' || this.form.invalid || this.submitting()) {
      return;
    }

    const value = this.form.getRawValue();
    this.submitted.emit({
      roomId: room.roomId,
      status: value.status,
    });
  }

  protected hasError(controlName: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[controlName];
    return control.touched && control.invalid;
  }
}
