import { Component, ElementRef, HostListener, effect, inject, input, output } from '@angular/core';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  AccommodationParty,
  BookingPet,
  PET_SIZES,
  PET_TYPES,
  PetSize,
  PetType,
} from '../../../../shared/accommodation/accommodation-party.model';
import { formatAccommodationPartySummary } from '../../../../shared/accommodation/accommodation-party-presenter.util';
import {
  checkOutAfterCheckInValidator,
  dateNotInPastValidator,
  displayDateValidator,
  formatDateDigits,
  parseDisplayDate,
  toDisplayDate,
  todayDisplayDate,
  tomorrowDisplayDate,
} from '../../../../shared/date/display-date.util';
import { StaySearchCriteria } from '../../model/stay-search.model';

@Component({
  selector: 'app-stay-search-form',
  imports: [ReactiveFormsModule],
  templateUrl: './stay-search-form.html',
  styleUrl: './stay-search-form.scss',
})
export class StaySearchForm {
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  readonly compact = input(false);
  readonly initialCriteria = input<StaySearchCriteria | null>(null);
  readonly submitLabel = input('Search');
  readonly submitted = output<StaySearchCriteria>();
  protected readonly petTypes = PET_TYPES;
  protected readonly petSizes = PET_SIZES;
  protected readonly petWeightOptions = [
    { label: 'Up to 5 kg', value: 5 },
    { label: '6-15 kg', value: 15 },
    { label: '16-30 kg', value: 30 },
    { label: 'Over 30 kg', value: 31 },
  ] as const;
  protected readonly childAgeOptions = Array.from({ length: 18 }, (_, age) => age);
  protected readonly weekdayLabels = WEEKDAY_LABELS;
  protected guestsPickerOpen = false;
  protected datePickerOpen = false;
  private dateSelectionStep: DateSelectionStep = 'checkIn';
  private calendarBaseDate = startOfMonth(new Date());

  protected readonly form = new FormGroup(
    {
      destination: new FormControl('', {
        nonNullable: true,
        validators: [Validators.maxLength(80)],
      }),
      hotelId: new FormControl<number | null>(null, {
        validators: [Validators.min(1)],
      }),
      checkIn: new FormControl(todayDisplayDate(), {
        nonNullable: true,
        validators: [Validators.required, displayDateValidator, dateNotInPastValidator],
      }),
      checkOut: new FormControl(tomorrowDisplayDate(), {
        nonNullable: true,
        validators: [Validators.required, displayDateValidator, dateNotInPastValidator],
      }),
      adults: new FormControl<number>(2, {
        nonNullable: true,
        validators: [Validators.required, Validators.min(1), Validators.max(12)],
      }),
      children: new FormControl<number>(0, {
        nonNullable: true,
        validators: [Validators.required, Validators.min(0), Validators.max(8)],
      }),
      childrenAges: new FormArray<FormControl<number | null>>([]),
      pets: new FormArray<PetFormGroup>([]),
    },
    { validators: [checkOutAfterCheckInValidator] },
  );

  private readonly syncInitialCriteria = effect(() => {
    const criteria = this.initialCriteria();
    if (!criteria) {
      return;
    }

    this.form.patchValue(
      {
        destination: criteria.destination,
        hotelId: criteria.hotelId,
        checkIn: toDisplayDate(criteria.checkIn) || criteria.checkIn,
        checkOut: toDisplayDate(criteria.checkOut) || criteria.checkOut,
        adults: criteria.adults,
        children: criteria.childrenAges.length,
      },
      { emitEvent: false },
    );
    this.syncChildrenAges(criteria.childrenAges.length, criteria.childrenAges);
    this.syncPets(criteria.pets);
  });

  protected submit(): void {
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      return;
    }

    const value = this.form.getRawValue();
    const checkIn = parseDisplayDate(value.checkIn);
    const checkOut = parseDisplayDate(value.checkOut);

    if (!checkIn || !checkOut) {
      return;
    }

    this.submitted.emit({
      destination: value.destination.trim(),
      hotelId: normalizeHotelId(value.hotelId),
      checkIn,
      checkOut,
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

  protected toggleGuestsPicker(): void {
    this.guestsPickerOpen = !this.guestsPickerOpen;
    this.datePickerOpen = false;
  }

  protected closeGuestsPicker(): void {
    this.guestsPickerOpen = false;
  }

  protected openDatePicker(): void {
    this.datePickerOpen = true;
    this.guestsPickerOpen = false;
    this.dateSelectionStep = 'checkIn';
    const checkIn = parseDisplayDate(this.form.controls.checkIn.value);
    this.calendarBaseDate = checkIn ? startOfMonth(new Date(`${checkIn}T00:00:00`)) : startOfMonth(new Date());
  }

  protected closeDatePicker(): void {
    this.datePickerOpen = false;
    this.dateSelectionStep = 'checkIn';
  }

  protected calendarMonths(): CalendarMonth[] {
    return [createCalendarMonth(this.calendarBaseDate), createCalendarMonth(addMonths(this.calendarBaseDate, 1))];
  }

  protected showPreviousMonths(): void {
    const previousMonth = startOfMonth(addMonths(this.calendarBaseDate, -1));
    const currentMonth = startOfMonth(new Date());
    if (previousMonth < currentMonth) {
      return;
    }

    this.calendarBaseDate = previousMonth;
  }

  protected showNextMonths(): void {
    this.calendarBaseDate = startOfMonth(addMonths(this.calendarBaseDate, 1));
  }

  protected canShowPreviousMonths(): boolean {
    return startOfMonth(addMonths(this.calendarBaseDate, -1)) >= startOfMonth(new Date());
  }

  protected selectCalendarDate(isoDate: string): void {
    if (isoDate < toIsoDate(new Date())) {
      return;
    }

    if (this.dateSelectionStep === 'reset') {
      this.resetDateRangeSelection();
      return;
    }

    if (this.dateSelectionStep === 'checkIn') {
      this.applyIsoDate('checkIn', isoDate);
      this.applyIsoDate('checkOut', addDays(isoDate, 1));
      this.dateSelectionStep = 'checkOut';
      return;
    }

    const checkIn = parseDisplayDate(this.form.controls.checkIn.value);
    if (!checkIn || isoDate <= checkIn) {
      this.applyIsoDate('checkIn', isoDate);
      this.applyIsoDate('checkOut', addDays(isoDate, 1));
      this.dateSelectionStep = 'checkOut';
      return;
    }

    this.applyIsoDate('checkOut', isoDate);
    this.dateSelectionStep = 'reset';
  }

  protected applyStayLength(days: number): void {
    const checkIn = parseDisplayDate(this.form.controls.checkIn.value) ?? toIsoDate(new Date());
    this.applyIsoDate('checkIn', checkIn);
    this.applyIsoDate('checkOut', addDays(checkIn, days));
    this.dateSelectionStep = 'reset';
    this.closeDatePicker();
  }

  protected isSelectedDate(isoDate: string): boolean {
    return (
      isoDate === parseDisplayDate(this.form.controls.checkIn.value) ||
      isoDate === parseDisplayDate(this.form.controls.checkOut.value)
    );
  }

  protected isDateInSelectedRange(isoDate: string): boolean {
    const checkIn = parseDisplayDate(this.form.controls.checkIn.value);
    const checkOut = parseDisplayDate(this.form.controls.checkOut.value);
    return !!checkIn && !!checkOut && isoDate > checkIn && isoDate < checkOut;
  }

  protected childrenAgeControls(): FormControl<number | null>[] {
    return this.form.controls.childrenAges.controls;
  }

  protected guestsSummary(): string {
    return formatAccommodationPartySummary({
      adults: Number(this.form.controls.adults.value),
      childrenAges: this.childrenAgesValue(),
      pets: this.petsValue(),
    });
  }

  protected openPicker(input: HTMLInputElement): void {
    input.focus();
    input.showPicker();
  }

  protected applyPickerDate(controlName: 'checkIn' | 'checkOut', value: string): void {
    const displayValue = toDisplayDate(value);
    if (!displayValue) {
      return;
    }

    this.form.controls[controlName].setValue(displayValue);
    this.form.controls[controlName].markAsTouched();
  }

  protected normalizeDate(controlName: 'checkIn' | 'checkOut'): void {
    const control = this.form.controls[controlName];
    const normalized = toDisplayDate(parseDisplayDate(control.value) ?? '');
    if (normalized) {
      control.setValue(normalized);
    }
  }

  protected formatDateInput(controlName: 'checkIn' | 'checkOut'): void {
    const control = this.form.controls[controlName];
    const digits = String(control.value ?? '').replace(/\D/g, '').slice(0, 8);
    control.setValue(formatDateDigits(digits), { emitEvent: false });
  }

  protected nativeDateValue(value: string): string {
    return parseDisplayDate(value) ?? '';
  }

  protected childAgeLabel(age: number): string {
    return `${age} ${age === 1 ? 'year' : 'years'}`;
  }

  protected changeCounter(controlName: 'adults' | 'children', change: number): void {
    const control = this.form.controls[controlName];
    const min = controlName === 'children' ? 0 : 1;
    const max = controlName === 'children' ? 8 : 12;
    const nextValue = Math.min(max, Math.max(min, Number(control.value) + change));
    control.setValue(nextValue);
    control.markAsTouched();
    if (controlName === 'children') {
      this.syncChildrenAges(nextValue, this.childrenAgesValue());
    }
  }

  protected counterCanDecrease(controlName: 'adults' | 'children'): boolean {
    const value = Number(this.form.controls[controlName].value);
    return value > (controlName === 'children' ? 0 : 1);
  }

  protected counterCanIncrease(controlName: 'adults' | 'children'): boolean {
    const value = Number(this.form.controls[controlName].value);
    const max = controlName === 'children' ? 8 : 12;
    return value < max;
  }

  protected petControls(): PetFormGroup[] {
    return this.form.controls.pets.controls;
  }

  protected addPet(): void {
    this.form.controls.pets.push(createPetControl());
  }

  protected removePet(index: number): void {
    this.form.controls.pets.removeAt(index);
  }

  protected hasChildrenAgeError(index: number, error: string): boolean {
    const control = this.form.controls.childrenAges.at(index);
    return !!control && control.touched && control.hasError(error);
  }

  protected hasPetWeightError(index: number, error: string): boolean {
    const control = this.form.controls.pets.at(index)?.controls.weightKg;
    return !!control && control.touched && control.hasError(error);
  }

  @HostListener('document:click', ['$event'])
  protected closeGuestsPickerOnOutsideClick(event: MouseEvent): void {
    if (!this.guestsPickerOpen && !this.datePickerOpen) {
      return;
    }

    const target = event.target;
    if (!(target instanceof Node)) {
      return;
    }

    if (!this.elementRef.nativeElement.contains(target)) {
      this.guestsPickerOpen = false;
      this.datePickerOpen = false;
    }
  }

  private applyIsoDate(controlName: 'checkIn' | 'checkOut', isoDate: string): void {
    const displayValue = toDisplayDate(isoDate);
    if (!displayValue) {
      return;
    }

    this.form.controls[controlName].setValue(displayValue);
    this.form.controls[controlName].markAsTouched();
  }

  private resetDateRangeSelection(): void {
    this.applyIsoDate('checkIn', toIsoDate(new Date()));
    this.applyIsoDate('checkOut', addDays(toIsoDate(new Date()), 1));
    this.dateSelectionStep = 'checkIn';
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

  private syncChildrenAges(count: number, ages: readonly number[]): void {
    const controls = this.form.controls.childrenAges;

    while (controls.length < count) {
      controls.push(createChildAgeControl());
    }
    while (controls.length > count) {
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

interface CalendarDay {
  date: string;
  label: number;
  disabled: boolean;
}

interface CalendarMonth {
  label: string;
  leadingBlanks: number[];
  days: CalendarDay[];
}

type DateSelectionStep = 'checkIn' | 'checkOut' | 'reset';

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

function createCalendarMonth(date: Date): CalendarMonth {
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const leadingBlanks = Array.from({ length: (firstDay.getDay() + 6) % 7 }, (_, index) => index);
  const today = toIsoDate(new Date());

  return {
    label: firstDay.toLocaleDateString('en', { month: 'long', year: 'numeric' }),
    leadingBlanks,
    days: Array.from({ length: daysInMonth }, (_, index) => {
      const day = index + 1;
      return {
        date: toIsoDate(new Date(date.getFullYear(), date.getMonth(), day)),
        label: day,
        disabled: toIsoDate(new Date(date.getFullYear(), date.getMonth(), day)) < today,
      };
    }),
  };
}

function addMonths(date: Date, months: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addDays(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00`);
  date.setDate(date.getDate() + days);
  return toIsoDate(date);
}

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function normalizeHotelId(value: number | null): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null;
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
    weightKg: new FormControl<number | null>(5, { validators: [Validators.required, Validators.min(0)] }),
  });
}
