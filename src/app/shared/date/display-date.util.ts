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
    date.getDate() !== dayNumber
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

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
