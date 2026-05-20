import { Component, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CreateHotelRequestDto, UpdateHotelRequestDto } from '../../api/admin.dto';

type HotelStatus = CreateHotelRequestDto['status'];

export type HotelAdminCommand =
  | { mode: 'create'; request: CreateHotelRequestDto }
  | { mode: 'update'; hotelId: number; request: UpdateHotelRequestDto };

@Component({
  selector: 'app-hotel-admin-form',
  imports: [ReactiveFormsModule],
  templateUrl: './hotel-admin-form.html',
})
export class HotelAdminForm {
  readonly submitting = input(false);
  readonly submitted = output<HotelAdminCommand>();

  protected readonly statuses: readonly HotelStatus[] = ['ACTIVE', 'INACTIVE', 'UNDER_MAINTENANCE'];
  protected readonly form = new FormGroup({
    mode: new FormControl<'create' | 'update'>('create', { nonNullable: true }),
    pathHotelId: new FormControl<number | null>(null),
    hotelId: new FormControl<number | null>(null, [Validators.required, Validators.min(1)]),
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    city: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    country: new FormControl('Slovakia', { nonNullable: true, validators: [Validators.required] }),
    address: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    stars: new FormControl(4, { nonNullable: true, validators: [Validators.required, Validators.min(1)] }),
    description: new FormControl('', { nonNullable: true }),
    status: new FormControl<HotelStatus>('ACTIVE', { nonNullable: true, validators: [Validators.required] }),
    childrenAllowed: new FormControl(true, { nonNullable: true }),
    petsAllowed: new FormControl(false, { nonNullable: true }),
    infantMaxAge: new FormControl(2, { nonNullable: true, validators: [Validators.required, Validators.min(0)] }),
    childMaxAge: new FormControl(12, { nonNullable: true, validators: [Validators.required, Validators.min(0)] }),
    adultEquivalentAge: new FormControl(13, { nonNullable: true, validators: [Validators.required, Validators.min(0)] }),
  });

  protected submit(): void {
    this.form.markAllAsTouched();

    if (this.form.invalid || this.submitting()) {
      return;
    }

    const value = this.form.getRawValue();
    const request = {
      name: value.name.trim(),
      city: value.city.trim(),
      country: value.country.trim(),
      address: value.address.trim(),
      stars: Number(value.stars),
      description: value.description.trim() || undefined,
      status: value.status,
      childrenAllowed: value.childrenAllowed,
      petsAllowed: value.petsAllowed,
      infantMaxAge: Number(value.infantMaxAge),
      childMaxAge: Number(value.childMaxAge),
      adultEquivalentAge: Number(value.adultEquivalentAge),
    };

    if (value.mode === 'create') {
      this.submitted.emit({ mode: 'create', request: { hotelId: Number(value.hotelId), ...request } });
      return;
    }

    this.submitted.emit({ mode: 'update', hotelId: Number(value.pathHotelId || value.hotelId), request });
  }
}
