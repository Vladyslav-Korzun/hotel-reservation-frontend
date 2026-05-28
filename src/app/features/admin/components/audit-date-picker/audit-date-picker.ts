import {
  Component,
  ElementRef,
  HostListener,
  ViewEncapsulation,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';

interface CalendarDay {
  date: string;
  label: number;
}

interface CalendarMonth {
  label: string;
  leadingBlanks: number[];
  days: CalendarDay[];
}

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, n: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + n, 1);
}

function buildCalendarMonth(date: Date): CalendarMonth {
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const leadingBlanks = Array.from({ length: (firstDay.getDay() + 6) % 7 }, (_, i) => i);

  return {
    label: firstDay.toLocaleDateString('en', { month: 'long', year: 'numeric' }),
    leadingBlanks,
    days: Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      return {
        date: toIsoDate(new Date(date.getFullYear(), date.getMonth(), day)),
        label: day,
      };
    }),
  };
}

@Component({
  selector: 'app-audit-date-picker',
  templateUrl: './audit-date-picker.html',
  styleUrl: './audit-date-picker.scss',
  encapsulation: ViewEncapsulation.None,
})
export class AuditDatePicker {
  private readonly el = inject(ElementRef<HTMLElement>);

  readonly value = input('');
  readonly valueChange = output<string>();

  protected readonly isOpen = signal(false);
  protected readonly calendarBase = signal(startOfMonth(new Date()));
  protected readonly weekdayLabels = WEEKDAY_LABELS;
  protected readonly todayIso = toIsoDate(new Date());

  protected readonly calendarMonth = computed(() => buildCalendarMonth(this.calendarBase()));

  protected toggle(): void {
    if (this.isOpen()) {
      this.isOpen.set(false);
    } else {
      const v = this.value();
      this.calendarBase.set(v ? startOfMonth(new Date(`${v}T00:00:00`)) : startOfMonth(new Date()));
      this.isOpen.set(true);
    }
  }

  protected prevMonth(): void {
    this.calendarBase.set(startOfMonth(addMonths(this.calendarBase(), -1)));
  }

  protected nextMonth(): void {
    this.calendarBase.set(startOfMonth(addMonths(this.calendarBase(), 1)));
  }

  protected selectDate(iso: string): void {
    this.valueChange.emit(iso);
    this.isOpen.set(false);
  }

  protected clear(event: MouseEvent): void {
    event.stopPropagation();
    this.valueChange.emit('');
    this.isOpen.set(false);
  }

  protected formatDisplay(iso: string): string {
    if (!iso) return '';
    const d = new Date(`${iso}T00:00:00`);
    return d.toLocaleDateString('en', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  @HostListener('document:click', ['$event'])
  protected onOutsideClick(event: MouseEvent): void {
    if (!this.isOpen()) return;
    if (event.target instanceof Node && !this.el.nativeElement.contains(event.target)) {
      this.isOpen.set(false);
    }
  }
}
