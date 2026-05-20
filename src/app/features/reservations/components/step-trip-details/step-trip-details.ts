import { Component, computed, input, output, signal } from '@angular/core';
import { FormArray, FormControl, ReactiveFormsModule } from '@angular/forms';
import { ACCOMMODATION_LIMITS } from '../../../../shared/accommodation/accommodation-limits';
import { BookingPolicy, UNKNOWN_BOOKING_POLICY } from '../../../../shared/accommodation/booking-policy';
import { ageGroup, AgeGroup } from '../../../../shared/accommodation/guest-classification.util';
import {
  PetFormGroup,
  syncChildrenAgesCount,
} from '../../../../shared/accommodation/guests-form.util';
import { PetEditorList } from '../../../../shared/accommodation/pet-editor-list/pet-editor-list';
import { DateRangePicker } from '../../../stays/components/date-range-picker/date-range-picker';
import { AvailabilityByDate } from '../../../stays/model/availability.model';

export interface VisibleRangeChange {
  fromIso: string;
  toIso: string;
}

const CHILD_AGE_OPTIONS = Array.from({ length: 18 }, (_, age) => age);

@Component({
  selector: 'app-step-trip-details',
  imports: [ReactiveFormsModule, DateRangePicker, PetEditorList],
  templateUrl: './step-trip-details.html',
  styleUrl: './step-trip-details.scss',
})
export class StepTripDetails {
  readonly checkInControl = input.required<FormControl<string>>();
  readonly checkOutControl = input.required<FormControl<string>>();
  readonly adultsControl = input.required<FormControl<number>>();
  readonly childrenAgesArray = input.required<FormArray<FormControl<number | null>>>();
  readonly petsArray = input.required<FormArray<PetFormGroup>>();
  readonly rangeError = input('');
  readonly policy = input<BookingPolicy>(UNKNOWN_BOOKING_POLICY);
  readonly availabilityByDate = input<AvailabilityByDate>({});

  readonly next = output<void>();
  readonly visibleRangeChange = output<VisibleRangeChange>();
  protected readonly childAgeOptions = CHILD_AGE_OPTIONS;

  /** Bumped on every counter / array mutation so all derived signals refresh.
   *  FormControl.value isn't a signal, so computed() can't track it directly. */
  private readonly version = signal(0);

  /** Which child age picker row is expanded (`null` = all collapsed). */
  private readonly expandedChildIndex = signal<number | null>(null);

  protected isChildExpanded(i: number): boolean {
    return this.expandedChildIndex() === i;
  }

  protected toggleChildExpansion(i: number): void {
    this.expandedChildIndex.update((curr) => (curr === i ? null : i));
  }

  private bump(): void {
    this.version.update((v) => v + 1);
  }

  protected childrenAgeControls(): FormControl<number | null>[] {
    return this.childrenAgesArray().controls;
  }

  protected childAgeLabel(age: number): string {
    return `${age} ${age === 1 ? 'year' : 'years'} old`;
  }

  /** Classify a single child row's age against the active hotel policy. */
  protected childRowGroup(age: number | null): AgeGroup {
    return ageGroup(Number(age ?? 0), this.policy());
  }

  /** Row title shown in the collapsible header — adapts to age classification. */
  protected childRowTitle(age: number | null, index: number): string {
    switch (this.childRowGroup(age)) {
      case 'infant':
        return `Infant ${index + 1}`;
      case 'child':
        return `Child ${index + 1}`;
      case 'adult-equivalent-minor':
        return `Teen ${index + 1}`;
      default:
        return `Guest ${index + 1}`;
    }
  }

  /** Sub-label under the age value — explains how the row is counted. */
  protected childRowBadge(age: number | null): string {
    switch (this.childRowGroup(age)) {
      case 'infant':
        return 'shares with an adult';
      case 'child':
        return 'child slot';
      case 'adult-equivalent-minor':
        return 'counts as adult';
      default:
        return '';
    }
  }

  /** Section header — flips between "Children" / "Children / Infants" depending on policy. */
  protected readonly childrenSectionTitle = computed(() => {
    const p = this.policy();
    if (!p.childrenAllowed) return 'Children';
    return p.maxInfants > 0 && p.maxChildren > 0
      ? 'Children / Infants'
      : p.maxInfants > 0
        ? 'Infants'
        : 'Children';
  });

  protected setChildAge(index: number, age: number): void {
    const control = this.childrenAgesArray().at(index);
    if (!control) return;
    control.setValue(age);
    control.markAsTouched();
    this.expandedChildIndex.set(null);
  }

  protected readonly adultsValue = computed(() => {
    this.version();
    return Number(this.adultsControl().value);
  });

  protected readonly childrenCount = computed(() => {
    this.version();
    return this.childrenAgesArray().controls.length;
  });

  protected readonly petCount = computed(() => {
    this.version();
    return this.petsArray().controls.length;
  });

  /** Effective caps — min(global fallback, room-specific when > 0). */
  protected readonly adultsCap = computed(() =>
    effectiveCap(this.policy().maxAdults, ACCOMMODATION_LIMITS.MAX_ADULTS),
  );
  /** Children counter on Step 1 covers both "future children" and "future infants" —
   *  exact classification happens on Step 2 from DOB. We cap by maxChildren + maxInfants. */
  protected readonly childrenCap = computed(() => {
    const p = this.policy();
    if (!p.childrenAllowed) return 0;
    const sum = (p.maxChildren || 0) + (p.maxInfants || 0);
    return effectiveCap(sum, ACCOMMODATION_LIMITS.MAX_CHILDREN);
  });
  /**
   * Step-1 working budget for "adults + child rows".
   * Infants do NOT count toward backend `maxTotalGuests` (they share with an adult),
   * but classification happens on Step 2 from DOB. Until then we treat the cap as
   * `maxTotalGuests + maxInfants`, so a user can pick the composition advertised in the
   * policy hint (e.g. 2 adults + 1 child + 1 infant when totalGuests=3, infants=1).
   * The real per-category limits are re-validated on Step 2 and by the backend.
   */
  protected readonly totalGuestsCap = computed(() => {
    const p = this.policy();
    const infantsAllowance = p.childrenAllowed ? p.maxInfants || 0 : 0;
    const room = p.maxTotalGuests > 0 ? p.maxTotalGuests + infantsAllowance : 0;
    return effectiveCap(
      room,
      ACCOMMODATION_LIMITS.MAX_ADULTS + ACCOMMODATION_LIMITS.MAX_CHILDREN,
    );
  });
  protected readonly petsCap = computed(() =>
    this.policy().petsAllowed ? effectiveCap(this.policy().maxPets, 5) : 0,
  );
  protected readonly petsAllowed = computed(() => this.policy().petsAllowed);
  protected readonly childrenAllowed = computed(() => this.policy().childrenAllowed);

  protected readonly totalGuests = computed(() => this.adultsValue() + this.childrenCount());

  protected readonly adultsAtCap = computed(
    () => this.adultsValue() >= this.adultsCap() || this.totalGuests() >= this.totalGuestsCap(),
  );

  protected readonly childrenAtCap = computed(
    () =>
      !this.childrenAllowed() ||
      this.childrenCount() >= this.childrenCap() ||
      this.totalGuests() >= this.totalGuestsCap(),
  );

  protected readonly petsAtCap = computed(
    () => !this.petsAllowed() || this.petCount() >= this.petsCap(),
  );

  /** Human-readable description of the room's child policy under the counter. */
  protected readonly childrenPolicyHint = computed(() => {
    const p = this.policy();
    if (!p.childrenAllowed) return 'This hotel does not allow children or infants.';
    const bits: string[] = [];
    if (p.maxChildren > 0) bits.push(`up to ${p.maxChildren} ${p.maxChildren === 1 ? 'child' : 'children'}`);
    if (p.maxInfants > 0) bits.push(`up to ${p.maxInfants} ${p.maxInfants === 1 ? 'infant' : 'infants'}`);
    const room = bits.length ? ` · this room: ${bits.join(' + ')}` : '';
    return `Teens ${p.adultEquivalentAge}+ count as adults for capacity${room}`;
  });

  protected changeAdults(delta: number): void {
    const ctrl = this.adultsControl();
    const targetRaw = Number(ctrl.value) + delta;
    const target = clamp(
      targetRaw,
      1,
      Math.min(this.adultsCap(), this.totalGuestsCap() - this.childrenCount()),
    );
    ctrl.setValue(target);
    ctrl.markAsTouched();
    this.bump();
  }

  protected changeChildren(delta: number): void {
    if (!this.childrenAllowed()) return;
    const prevCount = this.childrenCount();
    const target = clamp(
      prevCount + delta,
      0,
      Math.min(this.childrenCap(), this.totalGuestsCap() - this.adultsValue()),
    );
    syncChildrenAgesCount(this.childrenAgesArray(), target);
    if (target > prevCount) {
      // Auto-expand the newly added row so user lands on chips.
      this.expandedChildIndex.set(target - 1);
    } else if (this.expandedChildIndex() !== null && this.expandedChildIndex()! >= target) {
      this.expandedChildIndex.set(null);
    }
    this.bump();
  }

  protected onContinue(): void {
    this.next.emit();
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function effectiveCap(roomLimit: number, globalFallback: number): number {
  return roomLimit > 0 ? Math.min(roomLimit, globalFallback) : globalFallback;
}
