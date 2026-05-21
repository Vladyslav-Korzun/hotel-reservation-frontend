import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import {
  dateNotInFutureValidator,
  displayDateValidator,
} from '../../../shared/date/display-date.util';

export type GuestRole = 'ADULT' | 'CHILD';
export type GuestGender = 'MALE' | 'FEMALE' | 'OTHER';

export const GUEST_GENDERS: ReadonlyArray<GuestGender> = ['MALE', 'FEMALE', 'OTHER'];

export type GuestDetailGroup = FormGroup<{
  role: FormControl<GuestRole>;
  firstName: FormControl<string>;
  lastName: FormControl<string>;
  dateOfBirth: FormControl<string>;
  gender: FormControl<GuestGender | null>;
}>;

export function createGuestDetailControl(role: GuestRole): GuestDetailGroup {
  return new FormGroup({
    role: new FormControl<GuestRole>(role, {
      nonNullable: true,
      validators: [Validators.required],
    }),
    firstName: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(60)],
    }),
    lastName: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(60)],
    }),
    dateOfBirth: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, displayDateValidator, dateNotInFutureValidator],
    }),
    gender: new FormControl<GuestGender | null>(null, {
      validators: [Validators.required],
    }),
  });
}

/**
 * Resize the `guests` FormArray so it has exactly one entry per adult and one per child,
 * in that order. Preserves existing user input where possible.
 */
export function syncGuestRoster(
  arr: FormArray<GuestDetailGroup>,
  adults: number,
  childCount: number,
): void {
  const desired: GuestRole[] = [
    ...Array<GuestRole>(Math.max(0, adults)).fill('ADULT'),
    ...Array<GuestRole>(Math.max(0, childCount)).fill('CHILD'),
  ];

  // Rebuild positions if roles diverge — simplest reliable algorithm.
  // Adult/child counts change rarely and only by one at a time, so cost is negligible.
  for (let i = 0; i < desired.length; i++) {
    const existing = arr.at(i);
    if (!existing) {
      arr.push(createGuestDetailControl(desired[i]));
      continue;
    }
    if (existing.controls.role.value !== desired[i]) {
      existing.controls.role.setValue(desired[i], { emitEvent: false });
    }
  }
  while (arr.length > desired.length) {
    arr.removeAt(arr.length - 1);
  }
}
