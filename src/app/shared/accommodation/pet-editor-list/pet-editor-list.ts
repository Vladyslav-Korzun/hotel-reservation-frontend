import { Component, computed, input, signal } from '@angular/core';
import { FormArray, ReactiveFormsModule } from '@angular/forms';
import { PET_TYPES, PetType } from '../accommodation-party.model';
import { ACCOMMODATION_LIMITS } from '../accommodation-limits';
import { PetFormGroup, createPetControl } from '../guests-form.util';

/**
 * Shared pet editor list — used by both the search guests-picker and the
 * reservation wizard step. Renders one segmented-type + weight card per pet,
 * plus an "Add pet" button capped at `maxPets`.
 *
 * Pet `size` is intentionally NOT shown: backend confirmed it is only
 * enum-validated, never used for filter logic. The default value stays in
 * `PetFormGroup` so the wire payload is valid.
 *
 * Parents own the section header (eyebrow / title / policy hint).
 */
const WEIGHT_OPTIONS = [
  { label: '0-5', value: 5 },
  { label: '6-15', value: 15 },
  { label: '16-30', value: 30 },
  { label: '30+', value: 31 },
] as const;

@Component({
  selector: 'app-pet-editor-list',
  imports: [ReactiveFormsModule],
  templateUrl: './pet-editor-list.html',
  styleUrl: './pet-editor-list.scss',
})
export class PetEditorList {
  readonly petsArray = input.required<FormArray<PetFormGroup>>();
  /** Effective cap (e.g. min(global, room-type maxPets)). Defaults to global. */
  readonly maxPets = input<number>(ACCOMMODATION_LIMITS.MAX_PETS);
  /** When false: list hidden, "not allowed" hint shown instead. */
  readonly allowed = input(true);
  /** Override the empty-state message. */
  readonly emptyLabel = input('No pets selected.');
  /** Override the "Add pet" button text. */
  readonly addLabel = input('Add a pet');

  protected readonly petTypes = PET_TYPES;
  protected readonly weightOptions = WEIGHT_OPTIONS;

  /** Bumped on each push/removeAt so derived signals re-run. */
  private readonly version = signal(0);

  protected readonly petCount = computed(() => {
    this.version();
    return this.petsArray().controls.length;
  });

  protected readonly atCap = computed(() => this.petCount() >= this.maxPets());

  protected petControls(): PetFormGroup[] {
    return this.petsArray().controls;
  }

  protected addPet(): void {
    if (this.atCap() || !this.allowed()) return;
    this.petsArray().push(createPetControl());
    this.version.update((v) => v + 1);
  }

  protected removePet(index: number): void {
    this.petsArray().removeAt(index);
    this.version.update((v) => v + 1);
  }

  protected selectType(index: number, type: PetType): void {
    const ctrl = this.petsArray().at(index)?.controls.type;
    if (ctrl) ctrl.setValue(type);
  }

  protected selectWeight(index: number, value: number): void {
    const ctrl = this.petsArray().at(index)?.controls.weightKg;
    if (ctrl) {
      ctrl.setValue(value);
      ctrl.markAsTouched();
    }
  }

  protected hasPetWeightError(index: number, error: string): boolean {
    const control = this.petsArray().at(index)?.controls.weightKg;
    return !!control && control.touched && control.hasError(error);
  }
}
