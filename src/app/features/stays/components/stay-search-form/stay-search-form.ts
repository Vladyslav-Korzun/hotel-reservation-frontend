import {
  Component,
  QueryList,
  ViewChild,
  ViewChildren,
  ViewEncapsulation,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  applyGuestsParty,
  createGuestsControls,
  readGuestsParty,
} from '../../../../shared/accommodation/guests-form.util';
import {
  checkOutAfterCheckInValidator,
  dateNotInPastValidator,
  displayDateValidator,
  parseDisplayDate,
  toDisplayDate,
  todayDisplayDate,
  tomorrowDisplayDate,
} from '../../../../shared/date/display-date.util';
import { Hotel } from '../../../hotels/model/hotel.model';
import { HotelsFacade } from '../../../hotels/services/hotels.facade';
import { StaySearchCriteria } from '../../model/stay-search.model';
import { DateRangePicker } from '../date-range-picker/date-range-picker';
import { GuestsPicker } from '../guests-picker/guests-picker';
import { SearchSelectField, SelectOption } from '../search-select-field/search-select-field';

@Component({
  selector: 'app-stay-search-form',
  imports: [ReactiveFormsModule, SearchSelectField, DateRangePicker, GuestsPicker],
  templateUrl: './stay-search-form.html',
  styleUrl: './stay-search-form.scss',
  encapsulation: ViewEncapsulation.None,
})
export class StaySearchForm {
  private readonly hotelsFacade = inject(HotelsFacade);

  @ViewChildren(SearchSelectField) private readonly selectFields!: QueryList<SearchSelectField>;
  @ViewChild(DateRangePicker) private readonly dateRangePicker?: DateRangePicker;
  @ViewChild(GuestsPicker) private readonly guestsPicker?: GuestsPicker;

  readonly compact = input(false);
  readonly initialCriteria = input<StaySearchCriteria | null>(null);
  readonly submitLabel = input('Search rooms');
  /** When false, the city + hotel selectors are hidden (e.g. on a single-hotel detail page). */
  readonly showLocationFields = input(true);
  readonly submitted = output<StaySearchCriteria>();

  private appliedCriteria: StaySearchCriteria | null = null;

  protected readonly hotels = signal<Hotel[]>([]);

  protected readonly citySelectOptions = computed<SelectOption[]>(() => [
    { value: '', label: 'Any city' },
    ...uniqueCities(this.hotels()).map((city) => ({ value: city, label: city })),
  ]);

  protected readonly hotelSelectOptions = computed<SelectOption[]>(() => {
    const filtered = filterHotelsByCity(this.hotels(), this.form.controls.destination.value);
    return [
      { value: null, label: 'Any hotel' },
      ...filtered.map((h) => ({ value: h.hotelId, label: `${h.name} — ${h.city}` })),
    ];
  });

  private readonly guests = createGuestsControls({ validated: true });

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
      adults: this.guests.adults,
      childrenAges: this.guests.childrenAges,
      pets: this.guests.pets,
    },
    { validators: [checkOutAfterCheckInValidator] },
  );

  constructor() {
    effect(() => {
      const criteria = this.initialCriteria();
      if (!criteria || criteria === this.appliedCriteria) return;
      this.appliedCriteria = criteria;

      this.form.patchValue(
        {
          destination: criteria.destination,
          hotelId: criteria.hotelId,
          checkIn: toDisplayDate(criteria.checkIn) || criteria.checkIn,
          checkOut: toDisplayDate(criteria.checkOut) || criteria.checkOut,
        },
        { emitEvent: false },
      );
      applyGuestsParty(this.guests, criteria);
      this.clearSelectedHotelIfOutsideCity();
    });

    this.form.controls.destination.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.clearSelectedHotelIfOutsideCity());

    this.hotelsFacade
      .listHotels()
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (hotels) => {
          this.hotels.set(hotels);
          this.clearSelectedHotelIfOutsideCity();
        },
        error: () => this.hotels.set([]),
      });
  }

  protected submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const value = this.form.getRawValue();
    const checkIn = parseDisplayDate(value.checkIn);
    const checkOut = parseDisplayDate(value.checkOut);
    if (!checkIn || !checkOut) return;

    const party = readGuestsParty(this.guests);
    this.submitted.emit({
      destination: value.destination.trim(),
      hotelId: normalizeHotelId(value.hotelId),
      checkIn,
      checkOut,
      ...party,
    });
  }

  protected hotelDisplayLabel(): string {
    const hotelId = this.form.controls.hotelId.value;
    if (!hotelId) return 'Any hotel';
    return this.hotels().find((h) => h.hotelId === hotelId)?.name ?? 'Any hotel';
  }

  protected cityDisplayLabel(): string {
    return this.form.controls.destination.value || 'Any city';
  }

  protected hasError(controlName: 'checkIn' | 'checkOut' | 'adults', error: string): boolean {
    const control = this.form.controls[controlName];
    return control.touched && control.hasError(error);
  }

  protected hasDateRangeError(): boolean {
    return this.form.touched && this.form.hasError('checkOutAfterCheckIn');
  }

  protected closeOtherPickers(except?: SearchSelectField): void {
    this.selectFields?.forEach((f) => {
      if (f !== except) f.close();
    });
    this.dateRangePicker?.close();
    this.guestsPicker?.close();
  }

  private clearSelectedHotelIfOutsideCity(): void {
    const city = this.form.controls.destination.value.trim();
    const hotelId = normalizeHotelId(this.form.controls.hotelId.value);
    if (!city || !hotelId) return;
    const selected = this.hotels().find((h) => h.hotelId === hotelId);
    if (selected && !sameCity(selected.city, city)) {
      this.form.controls.hotelId.setValue(null, { emitEvent: false });
    }
  }
}

/* ── Helpers ────────────────────────────────────────────────────────────── */

function normalizeHotelId(value: number | null): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null;
}

function uniqueCities(hotels: readonly Hotel[]): string[] {
  return Array.from(new Set(hotels.map((h) => h.city).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b),
  );
}

function filterHotelsByCity(hotels: readonly Hotel[], city: string): Hotel[] {
  const normalized = city.trim();
  const filtered = normalized ? hotels.filter((h) => sameCity(h.city, normalized)) : hotels;
  return [...filtered].sort((a, b) => a.name.localeCompare(b.name));
}

function sameCity(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}
