import { Component, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CreateRoomRequestDto, UpdateRoomRequestDto } from '../../api/admin.dto';

type RoomStatus = CreateRoomRequestDto['status'];

export type RoomAdminCommand =
  | { mode: 'create'; request: CreateRoomRequestDto }
  | { mode: 'update'; roomId: number; request: UpdateRoomRequestDto };

@Component({
  selector: 'app-room-admin-form',
  imports: [ReactiveFormsModule],
  templateUrl: './room-admin-form.html',
})
export class RoomAdminForm {
  readonly submitting = input(false);
  readonly submitted = output<RoomAdminCommand>();

  protected readonly statuses: readonly RoomStatus[] = ['AVAILABLE', 'CLEANING', 'MAINTENANCE', 'OUT_OF_SERVICE'];
  protected readonly form = new FormGroup({
    mode: new FormControl<'create' | 'update'>('create', { nonNullable: true }),
    pathRoomId: new FormControl<number | null>(null),
    roomId: new FormControl<number | null>(null, [Validators.required, Validators.min(1)]),
    hotelId: new FormControl<number | null>(null, [Validators.required, Validators.min(1)]),
    roomNumber: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    roomTypeId: new FormControl<number | null>(null, [Validators.required, Validators.min(1)]),
    capacity: new FormControl(2, { nonNullable: true, validators: [Validators.required, Validators.min(1)] }),
    status: new FormControl<RoomStatus>('AVAILABLE', { nonNullable: true, validators: [Validators.required] }),
  });

  protected submit(): void {
    this.form.markAllAsTouched();

    if (this.form.invalid || this.submitting()) {
      return;
    }

    const value = this.form.getRawValue();
    const request = {
      hotelId: Number(value.hotelId),
      roomNumber: value.roomNumber.trim(),
      roomTypeId: Number(value.roomTypeId),
      capacity: Number(value.capacity),
      status: value.status,
    };

    if (value.mode === 'create') {
      this.submitted.emit({ mode: 'create', request: { roomId: Number(value.roomId), ...request } });
      return;
    }

    this.submitted.emit({ mode: 'update', roomId: Number(value.pathRoomId || value.roomId), request });
  }
}
