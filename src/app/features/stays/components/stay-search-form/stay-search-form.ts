import { Component, effect, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  checkOutAfterCheckInValidator,
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
  readonly compact = input(false);
  readonly initialCriteria = input<StaySearchCriteria | null>(null);
  readonly submitLabel = input('Search');
  readonly submitted = output<StaySearchCriteria>();

  protected readonly form = new FormGroup(
    {
      destination: new FormControl('Stavanger, Norway', {
        nonNullable: true,
        validators: [Validators.required, Validators.maxLength(80)],
      }),
      checkIn: new FormControl(todayDisplayDate(), {
        nonNullable: true,
        validators: [Validators.required, displayDateValidator],
      }),
      checkOut: new FormControl(tomorrowDisplayDate(), {
        nonNullable: true,
        validators: [Validators.required, displayDateValidator],
      }),
      guests: new FormControl<number>(2, {
        nonNullable: true,
        validators: [Validators.required, Validators.min(1), Validators.max(12)],
      }),
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
        checkIn: toDisplayDate(criteria.checkIn) || criteria.checkIn,
        checkOut: toDisplayDate(criteria.checkOut) || criteria.checkOut,
        guests: criteria.guests,
      },
      { emitEvent: false },
    );
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
      destination: value.destination,
      checkIn,
      checkOut,
      guests: Number(value.guests),
    });
  }

  protected hasError(controlName: keyof typeof this.form.controls, error: string): boolean {
    const control = this.form.controls[controlName];
    return control.touched && control.hasError(error);
  }

  protected hasDateRangeError(): boolean {
    return this.form.touched && this.form.hasError('checkOutAfterCheckIn');
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

  protected changeGuests(change: number): void {
    const control = this.form.controls.guests;
    const nextValue = Math.min(12, Math.max(1, Number(control.value) + change));
    control.setValue(nextValue);
    control.markAsTouched();
  }
}
