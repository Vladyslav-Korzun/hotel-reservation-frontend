import { Component, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CreateServiceOfferingRequestDto, UpdateServiceOfferingRequestDto } from '../../api/admin.dto';

export type ServiceOfferingAdminCommand =
  | { mode: 'create'; hotelId: number; request: CreateServiceOfferingRequestDto }
  | { mode: 'update'; hotelId: number; serviceId: number; request: UpdateServiceOfferingRequestDto }
  | { mode: 'deactivate'; hotelId: number; serviceId: number };

@Component({
  selector: 'app-service-offering-admin-form',
  imports: [ReactiveFormsModule],
  templateUrl: './service-offering-admin-form.html',
})
export class ServiceOfferingAdminForm {
  readonly submitting = input(false);
  readonly submitted = output<ServiceOfferingAdminCommand>();

  protected readonly form = new FormGroup({
    mode: new FormControl<'create' | 'update' | 'deactivate'>('create', { nonNullable: true }),
    hotelId: new FormControl<number | null>(null, [Validators.required, Validators.min(1)]),
    serviceId: new FormControl<number | null>(null),
    serviceOfferingId: new FormControl<number | null>(null, [Validators.required, Validators.min(1)]),
    code: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    description: new FormControl('', { nonNullable: true }),
    priceAmount: new FormControl(20, { nonNullable: true, validators: [Validators.required, Validators.min(0)] }),
    priceCurrency: new FormControl('EUR', { nonNullable: true, validators: [Validators.required] }),
    active: new FormControl(true, { nonNullable: true }),
    availabilityRule: new FormControl('', { nonNullable: true }),
  });

  protected submit(): void {
    this.form.markAllAsTouched();

    if (this.form.invalid || this.submitting()) {
      return;
    }

    const value = this.form.getRawValue();
    const hotelId = Number(value.hotelId);
    const serviceId = Number(value.serviceId || value.serviceOfferingId);

    if (value.mode === 'deactivate') {
      this.submitted.emit({ mode: 'deactivate', hotelId, serviceId });
      return;
    }

    const request = {
      code: value.code.trim(),
      name: value.name.trim(),
      description: value.description.trim() || undefined,
      priceAmount: Number(value.priceAmount),
      priceCurrency: value.priceCurrency.trim(),
      active: value.active,
      availabilityRule: value.availabilityRule.trim() || undefined,
    };

    if (value.mode === 'create') {
      this.submitted.emit({
        mode: 'create',
        hotelId,
        request: { serviceOfferingId: Number(value.serviceOfferingId), ...request },
      });
      return;
    }

    this.submitted.emit({ mode: 'update', hotelId, serviceId, request });
  }
}
