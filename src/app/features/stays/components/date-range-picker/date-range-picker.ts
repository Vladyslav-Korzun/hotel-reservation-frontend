import {
  Component,
  ElementRef,
  HostListener,
  OnInit,
  ViewEncapsulation,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { AvailabilityByDate } from '../../model/availability.model';
import {
  formatDateDigits,
  parseDisplayDate,
  toDisplayDate,
  toIsoDate,
} from '../../../../shared/date/display-date.util';

/* ── Calendar helpers (file-local) ───────────────────────────────────────── */

interface CalendarDay {
  date: string;
  label: number;
  /** Past, or marked unavailable by external availability data */
  disabled: boolean;
  /** Externally known to be unavailable (vs. just in the past) — drives the strike-through style */
  unavailable: boolean;
}

interface CalendarMonth {
  label: string;
  leadingBlanks: number[];
  days: CalendarDay[];
}

type DateFieldName = 'checkIn' | 'checkOut';

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function addMonths(date: Date, months: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

function addDays(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00`);
  date.setDate(date.getDate() + days);
  return toIsoDate(date);
}

function buildCalendarMonth(date: Date, availability: AvailabilityByDate): CalendarMonth {
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const leadingBlanks = Array.from({ length: (firstDay.getDay() + 6) % 7 }, (_, i) => i);
  const today = toIsoDate(new Date());

  return {
    label: firstDay.toLocaleDateString('en', { month: 'long', year: 'numeric' }),
    leadingBlanks,
    days: Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const iso = toIsoDate(new Date(date.getFullYear(), date.getMonth(), day));
      const past = iso < today;
      const slot = availability[iso];
      const unavailable = !!slot && slot.available === false;
      return {
        date: iso,
        label: day,
        disabled: past || unavailable,
        unavailable,
      };
    }),
  };
}

/* ── Component ───────────────────────────────────────────────────────────── */

@Component({
  selector: 'app-date-range-picker',
  imports: [ReactiveFormsModule],
  templateUrl: './date-range-picker.html',
  styleUrl: './date-range-picker.scss',
  encapsulation: ViewEncapsulation.None,
})
export class DateRangePicker implements OnInit {
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  readonly checkInControl = input.required<FormControl<string>>();
  readonly checkOutControl = input.required<FormControl<string>>();
  readonly compact = input(false);
  /** Optional cross-field error shown below the trigger */
  readonly rangeError = input('');
  /** Per-day availability map; days missing from the map are considered "unknown" (selectable) */
  readonly availabilityByDate = input<AvailabilityByDate>({});

  /** Fires whenever the visible 2-month window changes (initially + on month nav). */
  readonly visibleRangeChange = output<{ fromIso: string; toIso: string }>();

  protected readonly isOpen = signal(false);
  private readonly calendarBase = signal(startOfMonth(new Date()));
  /** Inline error for an unavailable range the user just tried to select. */
  protected readonly availabilityError = signal('');

  protected readonly weekdayLabels = WEEKDAY_LABELS;

  protected readonly calendarMonths = computed(() => {
    const availability = this.availabilityByDate();
    return [
      buildCalendarMonth(this.calendarBase(), availability),
      buildCalendarMonth(addMonths(this.calendarBase(), 1), availability),
    ];
  });

  constructor() {
    // Emit visible range whenever the base month changes so the parent can fetch availability.
    effect(() => {
      const base = this.calendarBase();
      const fromIso = toIsoDate(base);
      const toIso = toIsoDate(endOfMonth(addMonths(base, 1)));
      this.visibleRangeChange.emit({ fromIso, toIso });
    });
  }

  ngOnInit(): void {
    // Initial range emit happens via the effect above on first render.
  }

  /** Called by parent to close this popover */
  close(): void {
    this.isOpen.set(false);
    this.availabilityError.set('');
  }

  protected open(): void {
    this.isOpen.set(true);
    this.availabilityError.set('');
    const checkIn = parseDisplayDate(this.checkInControl().value);
    this.calendarBase.set(
      checkIn ? startOfMonth(new Date(`${checkIn}T00:00:00`)) : startOfMonth(new Date()),
    );
  }

  protected showPreviousMonths(): void {
    const previous = startOfMonth(addMonths(this.calendarBase(), -1));
    if (previous < startOfMonth(new Date())) return;
    this.calendarBase.set(previous);
  }

  protected showNextMonths(): void {
    this.calendarBase.set(startOfMonth(addMonths(this.calendarBase(), 1)));
  }

  protected canShowPreviousMonths(): boolean {
    return startOfMonth(addMonths(this.calendarBase(), -1)) >= startOfMonth(new Date());
  }

  /**
   * Two-step range selection (hotel semantics — check-in date is inclusive,
   * check-out is the morning the guest leaves; same-day not allowed).
   *
   *  • No range yet           → click sets startDate, end stays empty
   *  • Only startDate set     → click AFTER  start → end set, range fixed
   *                          → click BEFORE start → new start, end cleared
   *                          → click ON     start → keep as start (no end)
   *  • Full range set         → click starts a new selection (only start)
   */
  protected selectCalendarDate(isoDate: string): void {
    if (isoDate < toIsoDate(new Date())) return;
    if (this.isUnavailable(isoDate)) return;

    const startDate = parseDisplayDate(this.checkInControl().value);
    const endDate = parseDisplayDate(this.checkOutControl().value);
    const hasFullRange = !!startDate && !!endDate;
    const hasOnlyStart = !!startDate && !endDate;

    // 3) Full range exists → restart selection
    if (hasFullRange) {
      this.applyDate('checkIn', isoDate);
      this.clearCheckOut();
      this.availabilityError.set('');
      return;
    }

    // 2) Only start is set
    if (hasOnlyStart) {
      // Click on the same day OR before start → replace start, wait for end
      if (isoDate <= startDate!) {
        this.applyDate('checkIn', isoDate);
        this.clearCheckOut();
        this.availabilityError.set('');
        return;
      }
      // Click strictly after start → validate and lock in as end
      if (!this.isRangeAvailable(startDate!, isoDate)) {
        // Spec: on availability error, wipe the whole range and wait for a fresh first click.
        this.clearField('checkIn');
        this.clearField('checkOut');
        this.availabilityError.set(
          'Some nights in this range are unavailable. Pick a different check-out date.',
        );
        return;
      }
      this.applyDate('checkOut', isoDate);
      this.availabilityError.set('');
      return;
    }

    // 1) Nothing selected yet → set start, wait for end
    this.applyDate('checkIn', isoDate);
    this.clearCheckOut();
    this.availabilityError.set('');
  }

  private clearField(field: DateFieldName): void {
    const control = this.controlFor(field);
    control.setValue('');
    control.markAsTouched();
  }

  // Back-compat alias for the existing call sites that only ever clear checkout
  private clearCheckOut(): void {
    this.clearField('checkOut');
  }

  protected isSelectedDate(isoDate: string): boolean {
    return (
      isoDate === parseDisplayDate(this.checkInControl().value) ||
      isoDate === parseDisplayDate(this.checkOutControl().value)
    );
  }

  protected isDateInSelectedRange(isoDate: string): boolean {
    const checkIn = parseDisplayDate(this.checkInControl().value);
    const checkOut = parseDisplayDate(this.checkOutControl().value);
    return !!checkIn && !!checkOut && isoDate > checkIn && isoDate < checkOut;
  }

  protected formatDateInput(field: DateFieldName): void {
    const control = this.controlFor(field);
    const digits = String(control.value ?? '').replace(/\D/g, '').slice(0, 8);
    control.setValue(formatDateDigits(digits), { emitEvent: false });
  }

  protected normalizeDate(field: DateFieldName): void {
    const control = this.controlFor(field);
    const normalized = toDisplayDate(parseDisplayDate(control.value) ?? '');
    if (normalized) control.setValue(normalized);
  }

  protected nativeDateValue(value: string): string {
    return parseDisplayDate(value) ?? '';
  }

  protected onNativePickerChange(field: DateFieldName, value: string): void {
    this.applyDate(field, value);
  }

  @HostListener('document:click', ['$event'])
  protected onOutsideClick(event: MouseEvent): void {
    if (!this.isOpen()) return;
    const target = event.target;
    if (target instanceof Node && !this.elementRef.nativeElement.contains(target)) {
      this.isOpen.set(false);
      this.availabilityError.set('');
    }
  }

  private controlFor(field: DateFieldName): FormControl<string> {
    return field === 'checkIn' ? this.checkInControl() : this.checkOutControl();
  }

  /** Apply a date value (ISO or display) to the given control. */
  private applyDate(field: DateFieldName, value: string): void {
    const displayValue = /^\d{4}-\d{2}-\d{2}$/.test(value) ? toDisplayDate(value) : value;
    if (!displayValue) return;
    const control = this.controlFor(field);
    control.setValue(displayValue);
    control.markAsTouched();
  }

  private isUnavailable(isoDate: string): boolean {
    const slot = this.availabilityByDate()[isoDate];
    return !!slot && slot.available === false;
  }

  /**
   * Check every night in `[checkInIso, checkOutIso)`.
   * Missing days in the map are treated as available (data hasn't loaded yet).
   */
  private isRangeAvailable(checkInIso: string, checkOutIso: string): boolean {
    const availability = this.availabilityByDate();
    let cursor = checkInIso;
    while (cursor < checkOutIso) {
      const slot = availability[cursor];
      if (slot && (slot.available === false || slot.availableCount <= 0)) return false;
      cursor = addDays(cursor, 1);
    }
    return true;
  }
}
