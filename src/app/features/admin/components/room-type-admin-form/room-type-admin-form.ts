import { Component, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RoomAmenityCodeDto } from '../../../hotels/api/hotel.dto';
import { ROOM_AMENITY_META } from '../../../../shared/accommodation/room-amenities';
import { CreateRoomTypeRequestDto, UpdateRoomTypeRequestDto } from '../../api/admin.dto';

type PetType = CreateRoomTypeRequestDto['allowedPetTypes'][number];

const ROOM_SIZE_MAX_SQM = 1000;
const BED_SETUP_MAX_LENGTH = 120;

export type RoomTypeAdminCommand =
  | { mode: 'create'; request: CreateRoomTypeRequestDto }
  | { mode: 'update'; roomTypeId: number; request: UpdateRoomTypeRequestDto };

@Component({
  selector: 'app-room-type-admin-form',
  imports: [ReactiveFormsModule],
  templateUrl: './room-type-admin-form.html',
})
export class RoomTypeAdminForm {
  readonly submitting = input(false);
  readonly submitted = output<RoomTypeAdminCommand>();

  protected readonly form = new FormGroup({
    mode: new FormControl<'create' | 'update'>('create', { nonNullable: true }),
    pathRoomTypeId: new FormControl<number | null>(null),
    roomTypeId: new FormControl<number | null>(null, [Validators.required, Validators.min(1)]),
    hotelId: new FormControl<number | null>(null, [Validators.required, Validators.min(1)]),
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    maxAdults: new FormControl(2, { nonNullable: true, validators: [Validators.required, Validators.min(1)] }),
    maxChildren: new FormControl(0, { nonNullable: true, validators: [Validators.required, Validators.min(0)] }),
    maxInfants: new FormControl(0, { nonNullable: true, validators: [Validators.required, Validators.min(0)] }),
    maxTotalGuests: new FormControl(2, { nonNullable: true, validators: [Validators.required, Validators.min(1)] }),
    petsAllowed: new FormControl(false, { nonNullable: true }),
    maxPets: new FormControl(0, { nonNullable: true, validators: [Validators.required, Validators.min(0)] }),
    allowedPetTypes: new FormControl('', { nonNullable: true }),
    maxPetWeightKg: new FormControl<number | null>(null),
    petFeeAmount: new FormControl<number | null>(null),
    petFeeCurrency: new FormControl('EUR', { nonNullable: true }),
    basePriceAmount: new FormControl(100, { nonNullable: true, validators: [Validators.required, Validators.min(0)] }),
    basePriceCurrency: new FormControl('EUR', { nonNullable: true, validators: [Validators.required] }),
    description: new FormControl('', { nonNullable: true }),
    bedSetup: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(BED_SETUP_MAX_LENGTH)],
    }),
    roomSizeSqm: new FormControl<number | null>(null, [Validators.min(1), Validators.max(ROOM_SIZE_MAX_SQM)]),
    amenities: new FormControl('', { nonNullable: true }),
  });

  /** Comma-separated list of valid amenity codes — shown as input hint. */
  protected readonly amenitiesHint = (Object.keys(ROOM_AMENITY_META) as RoomAmenityCodeDto[]).join(', ');

  protected submit(): void {
    this.form.markAllAsTouched();

    if (this.form.invalid || this.submitting()) {
      return;
    }

    const value = this.form.getRawValue();
    const request = {
      hotelId: Number(value.hotelId),
      name: value.name.trim(),
      maxAdults: Number(value.maxAdults),
      maxChildren: Number(value.maxChildren),
      maxInfants: Number(value.maxInfants),
      maxTotalGuests: Number(value.maxTotalGuests),
      petsAllowed: value.petsAllowed,
      maxPets: Number(value.maxPets),
      allowedPetTypes: parsePetTypes(value.allowedPetTypes),
      maxPetWeightKg: optionalNumber(value.maxPetWeightKg),
      petFeeAmount: optionalNumber(value.petFeeAmount),
      petFeeCurrency: value.petFeeCurrency.trim() || undefined,
      basePriceAmount: Number(value.basePriceAmount),
      basePriceCurrency: value.basePriceCurrency.trim(),
      description: value.description.trim() || undefined,
      bedSetup: value.bedSetup.trim() || null,
      roomSizeSqm: optionalNumber(value.roomSizeSqm),
      amenities: parseAmenities(value.amenities),
    };

    if (value.mode === 'create') {
      this.submitted.emit({ mode: 'create', request: { roomTypeId: Number(value.roomTypeId), ...request } });
      return;
    }

    this.submitted.emit({
      mode: 'update',
      roomTypeId: Number(value.pathRoomTypeId || value.roomTypeId),
      request,
    });
  }
}

function optionalNumber(value: number | null): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function parsePetTypes(value: string): PetType[] {
  return value
    .split(',')
    .map((item) => item.trim().toUpperCase())
    .filter((item): item is PetType => item === 'DOG' || item === 'CAT' || item === 'OTHER');
}

function parseAmenities(value: string): RoomAmenityCodeDto[] {
  if (!value.trim()) return [];
  const seen = new Set<string>();
  const out: RoomAmenityCodeDto[] = [];
  for (const raw of value.split(',')) {
    const code = raw.trim().toUpperCase();
    if (!code || seen.has(code)) continue;
    seen.add(code);
    if (code in ROOM_AMENITY_META) out.push(code as RoomAmenityCodeDto);
  }
  return out;
}
