import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { ACCOMMODATION_LIMITS } from './accommodation-limits';
import { AccommodationParty, BookingPet, PetSize, PetType } from './accommodation-party.model';

/* ── Types ──────────────────────────────────────────────────────────────── */

export type PetFormGroup = FormGroup<{
  type: FormControl<PetType>;
  size: FormControl<PetSize>;
  weightKg: FormControl<number | null>;
}>;

export interface GuestsFormControls {
  adults: FormControl<number>;
  childrenAges: FormArray<FormControl<number | null>>;
  pets: FormArray<PetFormGroup>;
}

/* ── Factories ──────────────────────────────────────────────────────────── */

export function createChildAgeControl(age = 0): FormControl<number | null> {
  return new FormControl<number | null>(age, {
    validators: [
      Validators.required,
      Validators.min(0),
      Validators.max(ACCOMMODATION_LIMITS.MAX_CHILD_AGE),
    ],
  });
}

export function createPetControl(pet?: BookingPet): PetFormGroup {
  return new FormGroup({
    type: new FormControl<PetType>(pet?.type ?? 'DOG', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    size: new FormControl<PetSize>(pet?.size ?? 'SMALL', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    weightKg: new FormControl<number | null>(pet?.weightKg ?? 5, {
      validators: [Validators.required, Validators.min(0)],
    }),
  });
}

/**
 * Build a fresh set of guest form controls.
 * Pass `validated: true` to attach min/max validators (used by the search form).
 */
export function createGuestsControls(
  options: { validated?: boolean; adults?: number } = {},
): GuestsFormControls {
  const { validated = false, adults = 2 } = options;

  return {
    adults: new FormControl<number>(adults, {
      nonNullable: true,
      validators: validated
        ? [Validators.required, Validators.min(1), Validators.max(ACCOMMODATION_LIMITS.MAX_ADULTS)]
        : [],
    }),
    childrenAges: new FormArray<FormControl<number | null>>([]),
    pets: new FormArray<PetFormGroup>([]),
  };
}

/* ── Sync ───────────────────────────────────────────────────────────────── */

/** Resize the children-ages array to `target` length, preserving existing values. */
export function syncChildrenAgesCount(
  arr: FormArray<FormControl<number | null>>,
  target: number,
  ages: readonly number[] = [],
): void {
  while (arr.length < target) arr.push(createChildAgeControl(ages[arr.length] ?? 0));
  while (arr.length > target) arr.removeAt(arr.length - 1);
  if (ages.length) {
    arr.controls.forEach((c, i) => c.setValue(ages[i] ?? c.value, { emitEvent: false }));
  }
}

/** Resize the pets array to match `pets` and patch each entry. */
export function syncPets(arr: FormArray<PetFormGroup>, pets: readonly BookingPet[]): void {
  while (arr.length < pets.length) arr.push(createPetControl());
  while (arr.length > pets.length) arr.removeAt(arr.length - 1);
  arr.controls.forEach((c, i) => {
    const pet = pets[i];
    if (pet) c.patchValue(pet, { emitEvent: false });
  });
}

/** Apply an entire AccommodationParty to the controls (adults + ages + pets). */
export function applyGuestsParty(controls: GuestsFormControls, party: AccommodationParty): void {
  controls.adults.setValue(party.adults, { emitEvent: false });
  syncChildrenAgesCount(controls.childrenAges, party.childrenAges.length, party.childrenAges);
  syncPets(controls.pets, party.pets);
}

/* ── Read ───────────────────────────────────────────────────────────────── */

export function readChildrenAges(arr: FormArray<FormControl<number | null>>): number[] {
  return arr.controls
    .map((c) => Number(c.value))
    .filter((v) => Number.isFinite(v) && v >= 0);
}

export function readPets(arr: FormArray<PetFormGroup>): BookingPet[] {
  return arr.controls.map((c) => ({
    type: c.controls.type.value,
    size: c.controls.size.value,
    weightKg: Number(c.controls.weightKg.value),
  }));
}

export function readGuestsParty(controls: GuestsFormControls): AccommodationParty {
  return {
    adults: Number(controls.adults.value),
    childrenAges: readChildrenAges(controls.childrenAges),
    pets: readPets(controls.pets),
  };
}
