import { Component, input, output } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { StaySearchCriteria } from '../../model/stay-search.model';

@Component({
  selector: 'app-stay-search-form',
  imports: [ReactiveFormsModule],
  templateUrl: './stay-search-form.html',
  styleUrl: './stay-search-form.scss',
})
export class StaySearchForm {
  readonly compact = input(false);
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

function checkOutAfterCheckInValidator(control: AbstractControl): ValidationErrors | null {
  const checkIn = parseDisplayDate(String(control.get('checkIn')?.value ?? ''));
  const checkOut = parseDisplayDate(String(control.get('checkOut')?.value ?? ''));

  if (!checkIn || !checkOut) {
    return null;
  }

  return checkOut > checkIn ? null : { checkOutAfterCheckIn: true };
}

function displayDateValidator(control: AbstractControl): ValidationErrors | null {
  return parseDisplayDate(String(control.value ?? '')) ? null : { invalidDate: true };
}

function todayDisplayDate(): string {
  return toDisplayDate(toIsoDate(new Date()));
}

function tomorrowDisplayDate(): string {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return toDisplayDate(toIsoDate(date));
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function parseDisplayDate(value: string): string | null {
  const match = value.trim().match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (!match) {
    return null;
  }

  const [, day, month, year] = match;
  const dayNumber = Number(day);
  const monthNumber = Number(month);
  const yearNumber = Number(year);
  const date = new Date(yearNumber, monthNumber - 1, dayNumber);

  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== yearNumber ||
    date.getMonth() !== monthNumber - 1 ||
    date.getDate() !== dayNumber
  ) {
    return null;
  }

  return `${year}-${month}-${day}`;
}

function toDisplayDate(value: string): string {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return '';
  }

  const [, year, month, day] = match;
  return `${day}.${month}.${year}`;
}

function formatDateDigits(value: string): string {
  if (value.length <= 2) {
    return value;
  }

  if (value.length <= 4) {
    return `${value.slice(0, 2)}.${value.slice(2)}`;
  }

  return `${value.slice(0, 2)}.${value.slice(2, 4)}.${value.slice(4)}`;
}
