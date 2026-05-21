import { Component, computed, input, output, signal } from '@angular/core';
import { FormArray, FormControl, ReactiveFormsModule } from '@angular/forms';
import { BookingPolicy, UNKNOWN_BOOKING_POLICY } from '../../../../shared/accommodation/booking-policy';
import { AgeGroup, ageGroup } from '../../../../shared/accommodation/guest-classification.util';
import {
  formatDateDigits,
  parseDisplayDate,
  toDisplayDate,
} from '../../../../shared/date/display-date.util';
import { getGuestAgeConsistencyIssue } from '../../wizard/guest-age-consistency';
import { GUEST_GENDERS, GuestDetailGroup, GuestGender } from '../../wizard/guest-detail';

interface GuestView {
  index: number;
  control: GuestDetailGroup;
  isAdult: boolean;
  positionLabel: string; // "Adult 1" / "Child 2"
  isBooker: boolean;
  childAge: number | null;
  /** 'infant' / 'child' / 'invalid' — derived from age + hotel policy. Null for adults. */
  ageGroup: AgeGroup | null;
}

@Component({
  selector: 'app-step-guest-details',
  imports: [ReactiveFormsModule],
  templateUrl: './step-guest-details.html',
  styleUrl: './step-guest-details.scss',
})
export class StepGuestDetails {
  readonly guestsArray = input.required<FormArray<GuestDetailGroup>>();
  readonly contactEmailControl = input.required<FormControl<string>>();
  readonly contactPhoneControl = input.required<FormControl<string>>();
  readonly specialRequestsControl = input.required<FormControl<string>>();
  readonly childrenAges = input<number[]>([]);
  readonly policy = input<BookingPolicy>(UNKNOWN_BOOKING_POLICY);
  /** Profile email shown as the prefill placeholder hint. */
  readonly profileEmailHint = input<string>('');
  readonly contactRequired = input(false);
  readonly showSpecialRequests = input(true);

  readonly back = output<void>();
  readonly next = output<void>();

  protected readonly genders = GUEST_GENDERS;

  /** Bumped when array length changes externally (e.g. adult counter on Step 1) */
  private readonly arrayVersion = signal(0);

  protected readonly guestViews = computed<readonly GuestView[]>(() => {
    this.arrayVersion();
    const arr = this.guestsArray();
    const ages = this.childrenAges();
    const p = this.policy();
    let adultIdx = 0;
    let childIdx = 0;

    return arr.controls.map((control, i) => {
      const isAdult = control.controls.role.value === 'ADULT';
      const positionLabel = isAdult ? `Adult ${++adultIdx}` : `Child ${++childIdx}`;
      const childAge = isAdult ? null : (ages[childIdx - 1] ?? null);
      const group: AgeGroup | null =
        isAdult || childAge === null || childAge < 0 ? null : ageGroup(childAge, p);
      return {
        index: i,
        control,
        isAdult,
        positionLabel,
        isBooker: i === 0,
        childAge,
        ageGroup: group,
      };
    });
  });

  protected setGender(control: GuestDetailGroup, gender: GuestGender): void {
    const current = control.controls.gender.value;
    control.controls.gender.setValue(current === gender ? null : gender);
  }

  /** Mask user input into DD.MM.YYYY as they type. */
  protected formatDobInput(control: GuestDetailGroup): void {
    const dobControl = control.controls.dateOfBirth;
    const digits = String(dobControl.value ?? '').replace(/\D/g, '').slice(0, 8);
    dobControl.setValue(formatDateDigits(digits), { emitEvent: false });
  }

  /** Re-normalize on blur (e.g. user typed 1.1.99 → 01.01.1999 is too aggressive; we keep as-is unless parseable). */
  protected normalizeDobInput(control: GuestDetailGroup): void {
    const dobControl = control.controls.dateOfBirth;
    const iso = parseDisplayDate(dobControl.value);
    if (iso) {
      dobControl.setValue(toDisplayDate(iso));
    }
  }

  protected dobConsistencyMessage(view: GuestView): string {
    return (
      getGuestAgeConsistencyIssue(
        view.control,
        view.isAdult ? null : view.childAge,
        this.policy(),
      )?.message ?? ''
    );
  }

  /**
   * Live phone formatter for international numbers. Strips non-digits,
   * keeps/adds a leading `+`, accepts `00` as an international prefix,
   * caps at E.164's 15 digits, and inserts a space every 3 digits.
   * Examples:
   *   "+421987654321"  → "+421 987 654 321"
   *   "421 987 654 321" → "+421 987 654 321"
   *   "00421987654321"  → "+421 987 654 321"
   */
  protected formatPhoneInput(): void {
    const ctrl = this.contactPhoneControl();
    const raw = ctrl.value ?? '';
    const trimmed = raw.trimStart();
    const digitsSource = trimmed.startsWith('00') ? trimmed.slice(2) : trimmed;
    const digits = digitsSource.replace(/\D/g, '').slice(0, 15);
    const grouped = digits.match(/.{1,3}/g)?.join(' ') ?? '';
    const formatted = digits ? `+${grouped}` : trimmed.startsWith('+') ? '+' : '';
    if (formatted !== raw) {
      ctrl.setValue(formatted, { emitEvent: false });
    }
  }
}
