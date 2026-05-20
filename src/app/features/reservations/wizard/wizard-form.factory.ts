import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import {
  createGuestsControls,
  GuestsFormControls,
  PetFormGroup,
} from '../../../shared/accommodation/guests-form.util';
import {
  checkOutAfterCheckInValidator,
  dateNotInPastValidator,
  displayDateValidator,
  todayDisplayDate,
  tomorrowDisplayDate,
} from '../../../shared/date/display-date.util';
import { GuestDetailGroup } from './guest-detail';

export type WizardForm = FormGroup<{
  // Identity (from URL / stay-card)
  hotelId: FormControl<number | null>;
  roomTypeId: FormControl<number | null>;
  // Trip
  checkIn: FormControl<string>;
  checkOut: FormControl<string>;
  // Party (reused via createGuestsControls)
  adults: FormControl<number>;
  childrenAges: FormArray<FormControl<number | null>>;
  pets: FormArray<PetFormGroup>;
  // Guest details (booker + accompanying)
  guests: FormArray<GuestDetailGroup>;
  // Per-booking contact (Tier 1 — backend snapshots these; null → Guest profile)
  contactEmail: FormControl<string>;
  contactPhone: FormControl<string>;
  // Free-form note to the hotel (Tier 2)
  specialRequests: FormControl<string>;
}>;

/** Build the single FormGroup that drives all 4 wizard steps. */
export function createWizardForm(): { form: WizardForm; guests: GuestsFormControls } {
  const guests = createGuestsControls({ validated: true });

  const form: WizardForm = new FormGroup(
    {
      hotelId: new FormControl<number | null>(null, {
        validators: [Validators.required, Validators.min(1)],
      }),
      roomTypeId: new FormControl<number | null>(null, {
        validators: [Validators.required, Validators.min(1)],
      }),
      checkIn: new FormControl<string>(todayDisplayDate(), {
        nonNullable: true,
        validators: [Validators.required, displayDateValidator, dateNotInPastValidator],
      }),
      checkOut: new FormControl<string>(tomorrowDisplayDate(), {
        nonNullable: true,
        validators: [Validators.required, displayDateValidator, dateNotInPastValidator],
      }),
      adults: guests.adults,
      childrenAges: guests.childrenAges,
      pets: guests.pets,
      guests: new FormArray<GuestDetailGroup>([]),
      contactEmail: new FormControl<string>('', {
        nonNullable: true,
        validators: [Validators.email, Validators.maxLength(255)],
      }),
      contactPhone: new FormControl<string>('', {
        nonNullable: true,
        validators: [Validators.maxLength(32)],
      }),
      specialRequests: new FormControl<string>('', {
        nonNullable: true,
        validators: [Validators.maxLength(500)],
      }),
    },
    { validators: [checkOutAfterCheckInValidator] },
  );

  return { form, guests };
}
