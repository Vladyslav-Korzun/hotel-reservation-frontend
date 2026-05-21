import { Component, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, finalize } from 'rxjs';
import { AuthService } from '../../../../core/auth/auth.service';
import { toProblemDetail } from '../../../../core/http/api-error.util';
import { ProblemDetail } from '../../../../core/http/problem-detail.model';
import { AccommodationParty } from '../../../../shared/accommodation/accommodation-party.model';
import { readAccommodationPartyFromQuery } from '../../../../shared/accommodation/accommodation-party-query.util';
import {
  applyGuestsParty,
  readGuestsParty,
} from '../../../../shared/accommodation/guests-form.util';
import { parseDisplayDate, toDisplayDate } from '../../../../shared/date/display-date.util';
import { HOTEL_PHOTO_IDS, unsplashUrl } from '../../../../shared/assets/placeholder-images';
import { ConfirmSuccessModal } from '../../../../shared/ui/confirm-success-modal/confirm-success-modal';
import { ErrorMessage } from '../../../../shared/ui/error-message/error-message';
import { Hotel, HotelServiceOffering } from '../../../hotels/model/hotel.model';
import { HotelsFacade } from '../../../hotels/services/hotels.facade';
import { AvailabilityByDate, RoomAvailabilityDay } from '../../../stays/model/availability.model';
import { StaysFacade } from '../../../stays/services/stays.facade';
import { BookingPolicy, UNKNOWN_BOOKING_POLICY } from '../../../../shared/accommodation/booking-policy';
import { ageGroup, canFitRoom } from '../../../../shared/accommodation/guest-classification.util';
import {
  LiveReservationSummary,
  SummaryDisplayDetails,
} from '../../components/live-reservation-summary/live-reservation-summary';
import { ReservationStepper } from '../../components/reservation-stepper/reservation-stepper';
import { StepGuestDetails } from '../../components/step-guest-details/step-guest-details';
import { StepReview } from '../../components/step-review/step-review';
import { StepServices } from '../../components/step-services/step-services';
import { StepTripDetails } from '../../components/step-trip-details/step-trip-details';
import {
  CreateReservationRequest,
  PublicCreateReservationRequest,
  Reservation,
  ReservationServiceSelection,
  StayingGuest,
} from '../../model/reservation.model';
import { ReservationsFacade } from '../../services/reservations.facade';
import { calcAgeFromDob, getGuestAgeConsistencyIssue } from '../../wizard/guest-age-consistency';
import { syncGuestRoster } from '../../wizard/guest-detail';
import { WizardStep } from '../../wizard/wizard-step';
import { WizardForm, createWizardForm } from '../../wizard/wizard-form.factory';

@Component({
  selector: 'app-create-reservation-page',
  imports: [
    ErrorMessage,
    ReservationStepper,
    LiveReservationSummary,
    StepTripDetails,
    StepGuestDetails,
    StepServices,
    StepReview,
    ConfirmSuccessModal,
  ],
  templateUrl: './create-reservation-page.html',
  styleUrl: './create-reservation-page.scss',
})
export class CreateReservationPage {
  private readonly reservations = inject(ReservationsFacade);
  private readonly hotels = inject(HotelsFacade);
  private readonly stays = inject(StaysFacade);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  /** Profile email from JWT — placeholder for the contactEmail input. */
  protected readonly profileEmail = computed(() => this.auth.user()?.email ?? '');
  protected readonly isPublicCheckout = computed(() => !this.auth.isAuthenticated());
  protected readonly isGuestSelfBooking = computed(
    () => this.auth.isAuthenticated() && this.auth.hasAnyRole(['GUEST']),
  );
  protected readonly isUnsupportedAuthenticatedUser = computed(
    () => this.auth.isAuthenticated() && !this.auth.hasAnyRole(['GUEST']),
  );

  protected readonly steps = WizardStep;

  /** Wizard state */
  protected readonly currentStep = signal<WizardStep>(WizardStep.Trip);
  protected readonly maxReachableStep = signal<WizardStep>(WizardStep.Trip);

  /** Async state */
  protected readonly saving = signal(false);
  protected readonly loadingServices = signal(false);
  protected readonly problem = signal<ProblemDetail | null>(null);
  protected readonly servicesProblem = signal<ProblemDetail | null>(null);
  protected readonly serviceOfferings = signal<HotelServiceOffering[]>([]);
  protected readonly selectedServices = signal<ReservationServiceSelection[]>([]);
  protected readonly successId = signal<string | null>(null);
  protected readonly successWasPublic = signal(false);
  /** Capacity / policy mismatch detected on the client before POST. */
  protected readonly capacityError = signal<string | null>(null);
  /** Aggregated list of reasons why the current step can't be left. Null when valid. */
  protected readonly stepError = signal<readonly string[] | null>(null);
  protected readonly availabilityByDate = signal<AvailabilityByDate>({});
  /** Track loaded windows to avoid duplicate requests on calendar nav. */
  private readonly loadedAvailabilityWindows = new Set<string>();

  /** Single form for all 4 steps (factory) */
  private readonly built = createWizardForm();
  protected readonly form = this.built.form;
  private readonly guestsControls = this.built.guests;

  /** Live snapshot of form value — basis for derivations */
  private readonly formValue = toSignal(this.form.valueChanges, {
    initialValue: this.form.getRawValue(),
  });

  /** Display details from URL params (hotel name, room name, location) */
  protected readonly displayDetails = readDisplayDetails(this.route);

  protected readonly summaryDisplay = computed<SummaryDisplayDetails>(() => ({
    hotelName: this.displayDetails.hotelName,
    roomName: this.displayDetails.roomName,
    location: this.displayDetails.location,
    photoUrl: this.displayDetails.photoUrl,
  }));

  protected readonly party = computed<AccommodationParty>(() => {
    this.formValue();
    return readGuestsParty(this.guestsControls);
  });

  protected readonly rangeError = computed(() =>
    this.form.touched && this.form.hasError('checkOutAfterCheckIn')
      ? 'Check-out must be after check-in.'
      : '',
  );

  /** Nightly price from URL (for live summary; backend doesn't echo it back) */
  protected readonly nightlyPrice: number;
  protected readonly currency: string;
  /** Combined room capacity + hotel age policy. Starts from URL params and merges
   *  with hotel details after the GET resolves (hotel data is authoritative for
   *  infantMaxAge / childMaxAge / childrenAllowed). */
  protected readonly policy = signal<BookingPolicy>(UNKNOWN_BOOKING_POLICY);

  constructor() {
    const initial = readInitialRequest(this.route);
    this.nightlyPrice = initial.nightlyPrice;
    this.currency = initial.currency;
    this.policy.set(initial.policy);

    // Patch identity + party from URL once
    if (initial.hotelId !== null) {
      this.form.controls.hotelId.setValue(initial.hotelId, { emitEvent: false });
    }
    if (initial.roomTypeId !== null) {
      this.form.controls.roomTypeId.setValue(initial.roomTypeId, { emitEvent: false });
    }
    if (initial.checkIn) {
      this.form.controls.checkIn.setValue(toDisplayDate(initial.checkIn) || initial.checkIn, {
        emitEvent: false,
      });
    }
    if (initial.checkOut) {
      this.form.controls.checkOut.setValue(toDisplayDate(initial.checkOut) || initial.checkOut, {
        emitEvent: false,
      });
    }
    applyGuestsParty(this.guestsControls, initial.party);

    // Anonymous checkout needs contact details because backend creates/finds
    // the Guest profile from this reservation request.
    effect(() => {
      const publicCheckout = this.isPublicCheckout();
      const email = this.form.controls.contactEmail;
      const phone = this.form.controls.contactPhone;

      email.setValidators(
        publicCheckout
          ? [Validators.required, Validators.email, Validators.maxLength(255)]
          : [Validators.email, Validators.maxLength(255)],
      );
      phone.setValidators(
        publicCheckout ? [Validators.required, Validators.maxLength(32)] : [Validators.maxLength(32)],
      );
      email.updateValueAndValidity({ emitEvent: false });
      phone.updateValueAndValidity({ emitEvent: false });
    });

    // Keep guests roster (Step 2) in sync with party size (adults + children)
    effect(() => {
      const v = this.formValue();
      const adults = Number(v.adults ?? 0);
      const childCount = (v.childrenAges ?? []).length;
      syncGuestRoster(this.form.controls.guests, adults, childCount);
    });

    // Load services + hotel details if hotelId is known
    const hotelId = this.form.controls.hotelId.value;
    if (hotelId) {
      this.loadHotelServices(hotelId);
      this.loadHotelPolicy(hotelId);
    }

    this.form.controls.hotelId.valueChanges.pipe(takeUntilDestroyed()).subscribe((id) => {
      if (id) {
        this.loadHotelServices(id);
        this.loadHotelPolicy(id);
      }
    });
  }

  /* ── Step navigation ──────────────────────────────────────────── */

  protected goTo(step: WizardStep): void {
    if (step === this.currentStep()) return;

    // Going backwards is always allowed — no validation.
    if (step < this.currentStep()) {
      this.currentStep.set(step);
      this.stepError.set(null);
      scrollToTop();
      return;
    }

    // Forward jumps are capped by `maxReachableStep` and must pass
    // validation of every intermediate step.
    if (step > this.maxReachableStep()) return;
    let cur = this.currentStep();
    while (cur < step) {
      if (!this.runStepValidation(cur)) return;
      cur = (cur + 1) as WizardStep;
    }
    this.currentStep.set(step);
    scrollToTop();
  }

  protected goNext(from: WizardStep): void {
    if (!this.runStepValidation(from)) return;

    const next = (from + 1) as WizardStep;
    if (next > WizardStep.Review) return;
    if (next > this.maxReachableStep()) {
      this.maxReachableStep.set(next);
    }
    this.currentStep.set(next);
    scrollToTop();
  }

  /**
   * Validate a step. Marks the relevant controls touched so inline errors
   * render, sets `stepError` to a human-readable list of reasons when blocked,
   * and returns `true` if the step can be left.
   */
  private runStepValidation(step: WizardStep): boolean {
    const issues =
      step === WizardStep.Trip
        ? this.collectTripIssues()
        : step === WizardStep.Guests
          ? this.collectGuestsIssues()
          : [];

    if (issues.length > 0) {
      this.stepError.set(issues);
      this.capacityError.set(null);
      return false;
    }
    this.stepError.set(null);
    this.capacityError.set(null);
    return true;
  }

  private collectTripIssues(): string[] {
    const c = this.form.controls;
    c.checkIn.markAsTouched();
    c.checkOut.markAsTouched();
    c.adults.markAsTouched();
    this.form.markAsTouched(); // for cross-field `checkOutAfterCheckIn`

    const issues: string[] = [];

    if (c.checkIn.hasError('required')) issues.push('Check-in date is required.');
    else if (c.checkIn.hasError('invalidDate')) issues.push('Check-in must use DD.MM.YYYY.');
    else if (c.checkIn.hasError('dateInPast')) issues.push('Check-in cannot be in the past.');

    if (c.checkOut.hasError('required')) issues.push('Check-out date is required.');
    else if (c.checkOut.hasError('invalidDate')) issues.push('Check-out must use DD.MM.YYYY.');
    else if (c.checkOut.hasError('dateInPast')) issues.push('Check-out cannot be in the past.');

    if (c.checkIn.valid && c.checkOut.valid && this.form.hasError('checkOutAfterCheckIn')) {
      issues.push('Check-out must be after check-in.');
    }

    if (c.adults.invalid) issues.push('At least one adult is required.');

    // Capacity check only matters when the dates+counts are syntactically valid.
    if (issues.length === 0) {
      const party = readGuestsParty(this.guestsControls);
      const fit = canFitRoom(party.adults, party.childrenAges, this.policy());
      if (!fit.ok) issues.push(fit.issue.message);
    }

    return issues;
  }

  private collectGuestsIssues(): string[] {
    const c = this.form.controls;
    if (this.isPublicCheckout()) {
      c.contactEmail.markAsTouched();
      c.contactPhone.markAsTouched();
    }
    c.guests.controls.forEach((g) => {
      g.controls.firstName.markAsTouched();
      g.controls.lastName.markAsTouched();
      g.controls.dateOfBirth.markAsTouched();
      g.controls.gender.markAsTouched();
    });

    const issues: string[] = [];

    if (this.isPublicCheckout()) {
      if (c.contactEmail.hasError('required')) {
        issues.push('Email is required for guest checkout.');
      } else if (c.contactEmail.hasError('email')) {
        issues.push('Use a valid email address.');
      }
      if (c.contactPhone.hasError('required')) {
        issues.push('Phone is required for guest checkout.');
      } else if (c.contactPhone.hasError('maxlength')) {
        issues.push('Phone is too long.');
      }
    }

    let missingNames = 0;
    let missingDob = 0;
    let badDob = 0;
    let missingGender = 0;
    let adultsAtLeastEighteen = 0;
    let adultIndex = 0;
    let childIndex = 0;
    const ageConsistencyIssues: string[] = [];
    c.guests.controls.forEach((g) => {
      if (g.controls.firstName.invalid || g.controls.lastName.invalid) missingNames++;
      const dob = g.controls.dateOfBirth;
      if (dob.hasError('required')) missingDob++;
      else if (dob.hasError('invalidDate') || dob.hasError('dateInFuture')) badDob++;
      if (g.controls.gender.invalid) missingGender++;

      if (g.controls.role.value === 'ADULT') {
        adultIndex++;
        const age = calcAgeFromDob(parseDisplayDate(dob.value) ?? '');
        if (age >= 18) adultsAtLeastEighteen++;
        const issue = getGuestAgeConsistencyIssue(g, null, this.policy());
        if (issue) ageConsistencyIssues.push(`Adult ${adultIndex}: ${issue.message}`);
      } else {
        const selectedAge = c.childrenAges.at(childIndex)?.value ?? null;
        childIndex++;
        const issue = getGuestAgeConsistencyIssue(g, selectedAge, this.policy());
        if (issue) ageConsistencyIssues.push(`${childAgeLabel(selectedAge, childIndex, this.policy())}: ${issue.message}`);
      }
    });

    if (missingNames > 0) {
      issues.push(
        `Fill in name and last name for ${missingNames} ${missingNames === 1 ? 'guest' : 'guests'}.`,
      );
    }
    if (missingDob > 0) {
      issues.push(
        `Date of birth missing for ${missingDob} ${missingDob === 1 ? 'guest' : 'guests'}.`,
      );
    }
    if (badDob > 0) {
      issues.push('Some dates of birth are invalid or in the future.');
    }
    if (missingGender > 0) {
      issues.push(
        `Select gender for ${missingGender} ${missingGender === 1 ? 'guest' : 'guests'}.`,
      );
    }
    if (missingDob === 0 && badDob === 0 && adultsAtLeastEighteen === 0 && ageConsistencyIssues.length === 0) {
      issues.push('At least one staying guest must be 18 or older.');
    }
    issues.push(...ageConsistencyIssues);

    return issues;
  }

  protected goBack(from: WizardStep): void {
    const prev = (from - 1) as WizardStep;
    if (prev < WizardStep.Trip) return;
    this.currentStep.set(prev);
    this.stepError.set(null);
    scrollToTop();
  }

  /* ── Service selection ────────────────────────────────────────── */

  protected onServiceSelectionsChange(selections: ReservationServiceSelection[]): void {
    this.selectedServices.set(selections);
  }

  /* ── Availability calendar ────────────────────────────────────── */

  protected onPickerRangeChange(range: { fromIso: string; toIso: string }): void {
    const hotelId = this.form.controls.hotelId.value;
    const roomTypeId = this.form.controls.roomTypeId.value;
    if (!hotelId || !roomTypeId) return;

    const windowKey = `${range.fromIso}|${range.toIso}`;
    if (this.loadedAvailabilityWindows.has(windowKey)) return;
    this.loadedAvailabilityWindows.add(windowKey);

    this.stays.getAvailabilityCalendar(hotelId, roomTypeId, range.fromIso, range.toIso).subscribe({
      next: (days) => this.mergeAvailability(days),
      error: () => {
        // Soft-fail: keep going; backend re-validates on POST.
        this.loadedAvailabilityWindows.delete(windowKey);
      },
    });
  }

  private mergeAvailability(days: readonly RoomAvailabilityDay[]): void {
    this.availabilityByDate.update((prev) => {
      const next = { ...prev };
      for (const d of days) next[d.date] = d;
      return next;
    });
  }

  private refetchAvailability(): void {
    const hotelId = this.form.controls.hotelId.value;
    const roomTypeId = this.form.controls.roomTypeId.value;
    if (!hotelId || !roomTypeId) return;
    this.stays.clearAvailabilityCache(hotelId, roomTypeId);
    this.availabilityByDate.set({});
    const previouslyLoaded = Array.from(this.loadedAvailabilityWindows);
    this.loadedAvailabilityWindows.clear();
    for (const key of previouslyLoaded) {
      const [fromIso, toIso] = key.split('|');
      this.onPickerRangeChange({ fromIso, toIso });
    }
  }

  /* ── Submit ───────────────────────────────────────────────────── */

  protected submit(): void {
    this.form.markAllAsTouched();

    if (this.isUnsupportedAuthenticatedUser() || (!this.isPublicCheckout() && !this.isGuestSelfBooking())) {
      this.problem.set({
        title: 'Guest account required',
        detail:
          'Signed-in staff and admin accounts must use the staff reservation flow. To reserve as a customer, use a guest account or sign out.',
        status: 403,
      });
      return;
    }

    const tripIssues = this.collectTripIssues();
    if (tripIssues.length > 0) {
      this.stepError.set(tripIssues);
      this.currentStep.set(WizardStep.Trip);
      return;
    }

    const guestIssues = this.collectGuestsIssues();
    if (guestIssues.length > 0) {
      this.stepError.set(guestIssues);
      this.currentStep.set(WizardStep.Guests);
      return;
    }

    if (this.form.invalid || this.saving()) return;

    const v = this.form.getRawValue();
    const checkIn = parseDisplayDate(v.checkIn);
    const checkOut = parseDisplayDate(v.checkOut);
    if (!checkIn || !checkOut || v.hotelId === null || v.roomTypeId === null) {
      return;
    }

    const party = readGuestsParty(this.guestsControls);

    // Final client-side capacity check (backend re-validates — this is UX-only).
    const fit = canFitRoom(party.adults, party.childrenAges, this.policy());
    if (!fit.ok) {
      this.stepError.set([fit.issue.message]);
      this.currentStep.set(WizardStep.Trip);
      return;
    }
    this.stepError.set(null);
    this.capacityError.set(null);

    const stayingGuests = toStayingGuests(v.guests ?? []);
    const primaryGuest = stayingGuests[0];
    if (!primaryGuest) {
      this.stepError.set(['At least one staying guest is required.']);
      this.currentStep.set(WizardStep.Guests);
      return;
    }

    const serviceOfferings = this.selectedServices().length ? this.selectedServices() : undefined;
    const publicCheckout = this.isPublicCheckout();
    const request$: Observable<Reservation> = publicCheckout
      ? this.reservations.createPublicReservation({
          hotelId: v.hotelId,
          roomTypeId: v.roomTypeId,
          firstName: primaryGuest.firstName,
          lastName: primaryGuest.lastName,
          email: v.contactEmail.trim(),
          phone: normalizePhone(v.contactPhone),
          checkIn,
          checkOut,
          stayingGuests,
          pets: party.pets,
          serviceOfferings,
        } satisfies PublicCreateReservationRequest)
      : this.reservations.createReservation({
          hotelId: v.hotelId,
          roomTypeId: v.roomTypeId,
          checkIn,
          checkOut,
          stayingGuests,
          pets: party.pets,
          serviceOfferings,
          contactEmail: trimToNull(v.contactEmail),
          contactPhone: normalizePhoneToNull(v.contactPhone),
          specialRequests: trimToNull(v.specialRequests),
        } satisfies CreateReservationRequest);

    this.problem.set(null);
    this.successWasPublic.set(publicCheckout);
    this.saving.set(true);

    request$
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (reservation) => this.successId.set(reservation.reservationId),
        error: (error: unknown) => {
          const problem = toProblemDetail(error);
          this.problem.set(problem);
          // If the backend rejected the booking (typically 409 Conflict — dates taken
          // by someone else mid-flow), wipe the availability cache and refetch so the
          // user immediately sees the conflict reflected in the date picker.
          if (problem.status === 409 || problem.status === 422) {
            this.refetchAvailability();
            this.currentStep.set(WizardStep.Trip);
          }
        },
      });
  }

  protected successTitle(): string {
    return this.successWasPublic() ? 'Reservation request received.' : 'All set! Your reservation is confirmed.';
  }

  protected successSubtitle(): string {
    return this.successWasPublic()
      ? 'We sent confirmation details to the contact email.'
      : 'We sent confirmation to your registered email.';
  }

  protected successPrimaryLabel(): string {
    return this.successWasPublic() ? 'Search another stay' : 'View reservation';
  }

  protected successSecondaryLabel(): string {
    return this.successWasPublic() ? 'Back to home' : 'Back to my reservations';
  }

  protected onSuccessPrimary(): void {
    if (this.successWasPublic()) {
      void this.router.navigate(['/stays/search']);
      return;
    }

    const id = this.successId();
    if (id) void this.router.navigate(['/reservations', id]);
  }

  protected onSuccessSecondary(): void {
    void this.router.navigate([this.successWasPublic() ? '/' : '/reservations/my']);
  }

  /* ── Services loader ──────────────────────────────────────────── */

  private loadHotelServices(hotelId: number): void {
    this.servicesProblem.set(null);
    this.loadingServices.set(true);

    this.hotels
      .getHotelServices(hotelId)
      .pipe(finalize(() => this.loadingServices.set(false)))
      .subscribe({
        next: (services) => this.serviceOfferings.set(services.filter((s) => s.active)),
        error: (error: unknown) => {
          this.serviceOfferings.set([]);
          this.servicesProblem.set(toProblemDetail(error));
        },
      });
  }

  /** Authoritative hotel age policy — merged into `policy` once fetched. */
  private loadHotelPolicy(hotelId: number): void {
    this.hotels.getHotelDetails(hotelId).subscribe({
      next: (hotel: Hotel) => {
        this.policy.update((p) => ({
          ...p,
          infantMaxAge: hotel.infantMaxAge,
          childMaxAge: hotel.childMaxAge,
          adultEquivalentAge: hotel.adultEquivalentAge,
          childrenAllowed: hotel.childrenAllowed,
          petsAllowed: hotel.petsAllowed || p.petsAllowed,
        }));
      },
      error: () => {
        // Soft-fail: keep URL-derived defaults, backend will re-validate on submit.
      },
    });
  }
}

/* ── URL param parsing ──────────────────────────────────────────── */

interface InitialRequest {
  hotelId: number | null;
  roomTypeId: number | null;
  checkIn: string;
  checkOut: string;
  party: AccommodationParty;
  nightlyPrice: number;
  currency: string;
  policy: BookingPolicy;
}

function readInitialRequest(route: ActivatedRoute): InitialRequest {
  const q = route.snapshot.queryParamMap;
  const hotelId = parsePositiveInt(q.get('hotelId'));
  const roomTypeId = parsePositiveInt(q.get('roomTypeId'));
  const nightlyPrice = parsePositiveFloat(q.get('nightlyPrice'));
  const currency = q.get('currency')?.trim() || 'EUR';
  return {
    hotelId,
    roomTypeId,
    checkIn: q.get('checkIn') ?? '',
    checkOut: q.get('checkOut') ?? '',
    party: readAccommodationPartyFromQuery(q, 1),
    nightlyPrice,
    currency,
    policy: {
      maxAdults: parsePositiveInt(q.get('maxAdults')) ?? 0,
      maxChildren: parseNonNegativeInt(q.get('maxChildren')),
      maxInfants: parseNonNegativeInt(q.get('maxInfants')),
      maxTotalGuests: parsePositiveInt(q.get('maxTotalGuests')) ?? 0,
      petsAllowed: q.get('petsAllowed') === 'true',
      maxPets: parseNonNegativeInt(q.get('maxPets')),
      infantMaxAge: parseNonNegativeInt(q.get('infantMaxAge')) || UNKNOWN_BOOKING_POLICY.infantMaxAge,
      childMaxAge: parseNonNegativeInt(q.get('childMaxAge')) || UNKNOWN_BOOKING_POLICY.childMaxAge,
      adultEquivalentAge:
        parseNonNegativeInt(q.get('adultEquivalentAge')) || UNKNOWN_BOOKING_POLICY.adultEquivalentAge,
      // Default to true when absent — most hotels allow children. Hotel fetch will override.
      childrenAllowed: q.get('childrenAllowed') !== 'false',
    },
  };
}

interface PageDisplayDetails {
  hotelName: string;
  roomName: string;
  location: string;
  photoUrl: string;
}

function readDisplayDetails(route: ActivatedRoute): PageDisplayDetails {
  const q = route.snapshot.queryParamMap;
  const hotelId = parsePositiveInt(q.get('hotelId')) ?? 0;
  return {
    hotelName: q.get('hotelName')?.trim() || (hotelId > 0 ? `Hotel #${hotelId}` : 'Selected hotel'),
    roomName: q.get('roomName')?.trim() || 'Selected room',
    location: q.get('location')?.trim() ?? '',
    photoUrl: unsplashUrl(HOTEL_PHOTO_IDS[hotelId % HOTEL_PHOTO_IDS.length], 400),
  };
}

function parsePositiveInt(value: string | null): number | null {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.trunc(n) : null;
}

function parsePositiveFloat(value: string | null): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function parseNonNegativeInt(value: string | null): number {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? Math.trunc(n) : 0;
}

function scrollToTop(): void {
  if (typeof window !== 'undefined') {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

/** Remove visual spacing from the phone mask before sending the payload. */
function normalizePhone(value: string | null | undefined): string {
  return (value ?? '').trim().replace(/\s+/g, '');
}

function normalizePhoneToNull(value: string | null | undefined): string | null {
  const normalized = normalizePhone(value);
  return normalized.length > 0 ? normalized : null;
}

function childAgeLabel(age: number | null, index: number, policy: BookingPolicy): string {
  if (age === null) return `Child ${index}`;
  switch (ageGroup(age, policy)) {
    case 'infant':
      return `Infant ${index}`;
    case 'adult-equivalent-minor':
      return `Teen ${index}`;
    default:
      return `Child ${index}`;
  }
}

function trimToNull(value: string | null | undefined): string | null {
  const trimmed = (value ?? '').trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toStayingGuests(guests: NonNullable<ReturnType<WizardForm['getRawValue']>['guests']>): StayingGuest[] {
  return guests.map((guest) => ({
    firstName: guest.firstName.trim(),
    lastName: guest.lastName.trim(),
    age: calcAgeFromDob(parseDisplayDate(guest.dateOfBirth) ?? ''),
    gender: guest.gender ?? 'OTHER',
  }));
}
