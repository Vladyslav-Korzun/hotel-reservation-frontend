import { AbstractControl, ValidationErrors } from '@angular/forms';

export function checkOutAfterCheckInValidator(control: AbstractControl): ValidationErrors | null {
  const checkIn = parseDisplayDate(String(control.get('checkIn')?.value ?? ''));
  const checkOut = parseDisplayDate(String(control.get('checkOut')?.value ?? ''));

  if (!checkIn || !checkOut) {
    return null;
  }

  return checkOut > checkIn ? null : { checkOutAfterCheckIn: true };
}

export function displayDateValidator(control: AbstractControl): ValidationErrors | null {
  return parseDisplayDate(String(control.value ?? '')) ? null : { invalidDate: true };
}

export function dateNotInPastValidator(control: AbstractControl): ValidationErrors | null {
  const value = parseDisplayDate(String(control.value ?? ''));
  if (!value) {
    return null;
  }

  return value >= toIsoDate(new Date()) ? null : { dateInPast: true };
}

/** Use on fields like date-of-birth which cannot be in the future. */
export function dateNotInFutureValidator(control: AbstractControl): ValidationErrors | null {
  const value = parseDisplayDate(String(control.value ?? ''));
  if (!value) {
    return null;
  }

  return value <= toIsoDate(new Date()) ? null : { dateInFuture: true };
}

export function todayDisplayDate(): string {
  return toDisplayDate(toIsoDate(new Date()));
}

export function tomorrowDisplayDate(): string {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return toDisplayDate(toIsoDate(date));
}

export function parseDisplayDate(value: string): string | null {
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
    date.getDate() !== dayNumber ||
    yearNumber < 1900 ||
    yearNumber > new Date().getFullYear()
  ) {
    return null;
  }

  return `${year}-${month}-${day}`;
}

export function toDisplayDate(value: string): string {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return '';
  }

  const [, year, month, day] = match;
  return `${day}.${month}.${year}`;
}

export function formatDateDigits(value: string): string {
  if (value.length <= 2) {
    return value;
  }

  if (value.length <= 4) {
    return `${value.slice(0, 2)}.${value.slice(2)}`;
  }

  return `${value.slice(0, 2)}.${value.slice(2, 4)}.${value.slice(4)}`;
}

/**
 * Convert a Date to an ISO date string (yyyy-MM-dd) using **local** calendar fields.
 * NB: `Date.toISOString()` would shift to UTC and drop a day for timezones east of GMT —
 * for calendar-day logic (check-in / check-out) we always want the local day the user sees.
 */
export function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Number of nights between two ISO dates.
 * `minimum = 1` for booking-style UIs that should always show at least one night,
 * `minimum = 0` (default) when the absence of valid dates should be visible to the user.
 */
export function calcNights(
  checkInIso: string | null | undefined,
  checkOutIso: string | null | undefined,
  options: { minimum?: number } = {},
): number {
  const minimum = options.minimum ?? 0;
  if (!checkInIso || !checkOutIso) return minimum;
  const ms = new Date(checkOutIso).getTime() - new Date(checkInIso).getTime();
  if (!Number.isFinite(ms)) return minimum;
  return Math.max(minimum, Math.round(ms / (1000 * 60 * 60 * 24)));
}
