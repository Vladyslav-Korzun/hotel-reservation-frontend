import { Component, effect, input, output } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import {
  BookingPet,
  PET_SIZES,
  PET_TYPES,
  PetSize,
  PetType,
} from '../../../../shared/accommodation/accommodation-party.model';
import { CreateReservationRequest, ReservationDisplayDetails } from '../../model/reservation.model';

@Component({
  selector: 'app-reservation-form',
  imports: [ReactiveFormsModule],
  templateUrl: './reservation-form.html',
  styleUrl: './reservation-form.scss',
})
export class ReservationForm {
  readonly submitting = input(false);
  readonly initialValue = input<Partial<CreateReservationRequest> | null>(null);
  readonly displayDetails = input<ReservationDisplayDetails | null>(null);
  readonly submitted = output<CreateReservationRequest>();
  protected readonly petTypes = PET_TYPES;
  protected readonly petSizes = PET_SIZES;

  protected readonly form = new FormGroup(
    {
      hotelId: new FormControl<number | null>(null, [Validators.required, Validators.min(1)]),
      roomTypeId: new FormControl<number | null>(null, [Validators.required, Validators.min(1)]),
      checkIn: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      checkOut: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      adults: new FormControl<number | null>(1, [Validators.required, Validators.min(1), Validators.max(12)]),
      childCount: new FormControl<number | null>(0, [Validators.required, Validators.min(0), Validators.max(8)]),
      childrenAges: new FormArray<FormControl<number | null>>([]),
      pets: new FormArray<PetFormGroup>([]),
    },
    { validators: [checkOutAfterCheckInValidator] },
  );

  constructor() {
    effect(() => {
      const initialValue = this.initialValue();

      if (initialValue) {
        this.form.patchValue(
          {
            ...initialValue,
            childCount: initialValue.childrenAges?.length ?? 0,
          },
          { emitEvent: false },
        );
        this.syncChildrenAges(initialValue.childrenAges ?? []);
        this.syncPets(initialValue.pets ?? []);
      }
    });
  }

  protected submit(): void {
    this.form.markAllAsTouched();

    if (this.form.invalid || this.submitting()) {
      return;
    }

    const value = this.form.getRawValue();
    this.submitted.emit({
      hotelId: Number(value.hotelId),
      roomTypeId: Number(value.roomTypeId),
      checkIn: value.checkIn,
      checkOut: value.checkOut,
      adults: Number(value.adults),
      childrenAges: this.childrenAgesValue(),
      pets: this.petsValue(),
    });
  }

  protected hasError(controlName: keyof typeof this.form.controls, error: string): boolean {
    const control = this.form.controls[controlName];
    return control.touched && control.hasError(error);
  }

  protected hasDateRangeError(): boolean {
    return this.form.touched && this.form.hasError('checkOutAfterCheckIn');
  }

  protected changeChildCount(change: number): void {
    const control = this.form.controls.childCount;
    const nextValue = Math.min(8, Math.max(0, Number(control.value) + change));
    control.setValue(nextValue);
    control.markAsTouched();
    this.syncChildrenAges(this.childrenAgesValue().slice(0, nextValue), nextValue);
  }

  protected childrenAgeControls(): FormControl<number | null>[] {
    return this.form.controls.childrenAges.controls;
  }

  protected addPet(): void {
    this.form.controls.pets.push(createPetControl());
  }

  protected removePet(index: number): void {
    this.form.controls.pets.removeAt(index);
  }

  protected petControls(): PetFormGroup[] {
    return this.form.controls.pets.controls;
  }

  protected hasChildrenAgeError(index: number, error: string): boolean {
    const control = this.form.controls.childrenAges.at(index);
    return !!control && control.touched && control.hasError(error);
  }

  protected hasPetWeightError(index: number, error: string): boolean {
    const control = this.form.controls.pets.at(index)?.controls.weightKg;
    return !!control && control.touched && control.hasError(error);
  }

  protected propertyLabel(): string {
    return this.displayDetails()?.propertyName || 'Selected property';
  }

  protected roomLabel(): string {
    return this.displayDetails()?.roomName || 'Selected room';
  }

  protected locationLabel(): string {
    return this.displayDetails()?.location || '';
  }

  private childrenAgesValue(): number[] {
    return this.form.controls.childrenAges.controls
      .map((control) => Number(control.value))
      .filter((value) => Number.isFinite(value) && value >= 0);
  }

  private petsValue(): BookingPet[] {
    return this.form.controls.pets.controls.map((control) => ({
      type: control.controls.type.value as PetType,
      size: control.controls.size.value as PetSize,
      weightKg: Number(control.controls.weightKg.value),
    }));
  }

  private syncChildrenAges(ages: readonly number[], explicitCount = ages.length): void {
    const controls = this.form.controls.childrenAges;

    while (controls.length < explicitCount) {
      controls.push(createChildAgeControl());
    }
    while (controls.length > explicitCount) {
      controls.removeAt(controls.length - 1);
    }

    controls.controls.forEach((control, index) => {
      control.setValue(ages[index] ?? 0, { emitEvent: false });
    });
  }

  private syncPets(pets: readonly BookingPet[]): void {
    const controls = this.form.controls.pets;

    while (controls.length < pets.length) {
      controls.push(createPetControl());
    }
    while (controls.length > pets.length) {
      controls.removeAt(controls.length - 1);
    }

    controls.controls.forEach((control, index) => {
      const pet = pets[index];
      if (!pet) {
        return;
      }

      control.patchValue(pet, { emitEvent: false });
    });
  }
}

function checkOutAfterCheckInValidator(control: AbstractControl): ValidationErrors | null {
  const checkIn = control.get('checkIn')?.value;
  const checkOut = control.get('checkOut')?.value;

  if (!checkIn || !checkOut) {
    return null;
  }

  return checkOut > checkIn ? null : { checkOutAfterCheckIn: true };
}

type PetFormGroup = FormGroup<{
  type: FormControl<PetType>;
  size: FormControl<PetSize>;
  weightKg: FormControl<number | null>;
}>;

function createChildAgeControl(): FormControl<number | null> {
  return new FormControl<number | null>(0, {
    validators: [Validators.required, Validators.min(0), Validators.max(17)],
  });
}

function createPetControl(): PetFormGroup {
  return new FormGroup({
    type: new FormControl<PetType>('DOG', { nonNullable: true, validators: [Validators.required] }),
    size: new FormControl<PetSize>('SMALL', { nonNullable: true, validators: [Validators.required] }),
    weightKg: new FormControl<number | null>(1, { validators: [Validators.required, Validators.min(0)] }),
  });
}
