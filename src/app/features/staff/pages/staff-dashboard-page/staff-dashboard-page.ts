import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormArray,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { catchError, finalize, forkJoin, map, of, switchMap } from 'rxjs';
import { AuthService } from '../../../../core/auth/auth.service';
import { toProblemDetail } from '../../../../core/http/api-error.util';
import { ProblemDetail } from '../../../../core/http/problem-detail.model';
import { ConfirmDialogOutlet, ConfirmDialogService } from '../../../../shared/ui/confirm-dialog/confirm-dialog';
import { ErrorMessage } from '../../../../shared/ui/error-message/error-message';
import { LoadingState } from '../../../../shared/ui/loading-state/loading-state';
import { StatusBadge } from '../../../../shared/ui/status-badge/status-badge';
import { formatInternationalPhone } from '../../../../shared/phone/phone-format.util';
import {
  dateNotInPastValidator,
  displayDateValidator,
  parseDisplayDate,
  todayDisplayDate,
  tomorrowDisplayDate,
} from '../../../../shared/date/display-date.util';
import { BookingPolicy, UNKNOWN_BOOKING_POLICY } from '../../../../shared/accommodation/booking-policy';
import { ageGroup, canFitRoom } from '../../../../shared/accommodation/guest-classification.util';
import { Hotel, HotelRoomType, HotelServiceOffering } from '../../../hotels/model/hotel.model';
import {
  Reservation,
  ReservationServiceSelection,
  ReservationStatus,
  StayingGuest,
  isCheckInAllowedReservation,
  isCheckOutAllowedReservation,
} from '../../../reservations/model/reservation.model';
import { ServiceOfferingSelector } from '../../../reservations/components/service-offering-selector/service-offering-selector';
import { DateRangePicker } from '../../../stays/components/date-range-picker/date-range-picker';
import { AvailabilityByDate, RoomAvailabilityDay } from '../../../stays/model/availability.model';
import { StaysFacade } from '../../../stays/services/stays.facade';
import { HotelsFacade } from '../../../hotels/services/hotels.facade';
import { RoomOperation, RoomStatus } from '../../model/room-operation.model';
import { RoomStatusForm, RoomStatusUpdate } from '../../components/room-status-form/room-status-form';
import { StaffCreateReservationRequest } from '../../model/staff-reservation.model';
import { StaffFacade } from '../../services/staff.facade';

type ReservationViewMode = 'list' | 'map';
type ReservationStatusFilter = ReservationStatus | 'ALL';
type ReservationSortMode = 'newest' | 'checkIn' | 'guest' | 'status';
type GuestGender = StayingGuest['gender'];

type StaffGuestFormGroup = FormGroup<{
  firstName: FormControl<string>;
  lastName: FormControl<string>;
  age: FormControl<number>;
  gender: FormControl<GuestGender>;
}>;

type StaffCreateForm = FormGroup<{
  roomTypeId: FormControl<number | null>;
  checkIn: FormControl<string>;
  checkOut: FormControl<string>;
  firstName: FormControl<string>;
  lastName: FormControl<string>;
  email: FormControl<string>;
  phone: FormControl<string>;
  stayingGuests: FormArray<StaffGuestFormGroup>;
}>;

interface CapacityFormError {
  message: string;
}

interface RoomFloor {
  floor: number;
  label: string;
  rooms: RoomOperation[];
}

const STATUS_FILTERS: readonly ReservationStatusFilter[] = [
  'ALL',
  'PENDING',
  'CONFIRMED',
  'CHECKED_IN',
  'CHECKED_OUT',
  'CANCELLED',
  'NO_SHOW',
];

const ROOM_STATUSES: readonly RoomStatus[] = [
  'AVAILABLE',
  'OCCUPIED',
  'CLEANING',
  'MAINTENANCE',
  'OUT_OF_SERVICE',
];

const STATUS_LABELS: Record<string, string> = {
  ALL: 'All',
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  CHECKED_IN: 'Checked in',
  CHECKED_OUT: 'Checked out',
  CANCELLED: 'Cancelled',
  NO_SHOW: 'No show',
  AVAILABLE: 'Available',
  OCCUPIED: 'Occupied',
  CLEANING: 'Cleaning',
  MAINTENANCE: 'Maintenance',
  OUT_OF_SERVICE: 'Out of service',
};

const MS_PER_DAY = 86_400_000;

@Component({
  selector: 'app-staff-dashboard-page',
  imports: [
    ReactiveFormsModule,
    ConfirmDialogOutlet,
    ErrorMessage,
    LoadingState,
    StatusBadge,
    RoomStatusForm,
    ServiceOfferingSelector,
    DateRangePicker,
  ],
  templateUrl: './staff-dashboard-page.html',
  styleUrl: './staff-dashboard-page.scss',
})
export class StaffDashboardPage {
  private readonly staffFacade = inject(StaffFacade);
  private readonly hotelsFacade = inject(HotelsFacade);
  private readonly staysFacade = inject(StaysFacade);
  private readonly authService = inject(AuthService);
  private readonly confirmDialog = inject(ConfirmDialogService);

  protected readonly reservations = signal<Reservation[]>([]);
  protected readonly rooms = signal<RoomOperation[]>([]);
  protected readonly hotel = signal<Hotel | null>(null);
  protected readonly hotelId = signal<number | null>(null);
  protected readonly roomTypes = signal<HotelRoomType[]>([]);
  protected readonly hotelServices = signal<HotelServiceOffering[]>([]);

  protected readonly loading = signal(false);
  protected readonly problem = signal<ProblemDetail | null>(null);
  protected readonly lookupProblem = signal<ProblemDetail | null>(null);
  protected readonly accessProblem = signal<ProblemDetail | null>(null);
  protected readonly busyReservationId = signal<string | null>(null);
  protected readonly roomStatusUpdating = signal(false);
  protected readonly roomStatusProblem = signal<ProblemDetail | null>(null);
  protected readonly creatingReservation = signal(false);
  protected readonly createProblem = signal<ProblemDetail | null>(null);
  protected readonly createFormError = signal('');
  protected readonly latestCreatedReservation = signal<Reservation | null>(null);
  protected readonly latestUpdatedRoom = signal<RoomOperation | null>(null);

  protected readonly statusFilter = signal<ReservationStatusFilter>('ALL');
  protected readonly searchTerm = signal('');
  protected readonly sortMode = signal<ReservationSortMode>('newest');
  protected readonly viewMode = signal<ReservationViewMode>('list');
  protected readonly selectedRoom = signal<RoomOperation | null>(null);
  protected readonly createModalOpen = signal(false);
  protected readonly selectedServices = signal<ReservationServiceSelection[]>([]);

  /** Per-day availability shown in the create-reservation date picker. */
  protected readonly availabilityByDate = signal<AvailabilityByDate>({});
  private readonly loadedAvailabilityWindows = new Set<string>();
  private lastVisibleRange: { fromIso: string; toIso: string } | null = null;

  protected readonly statusFilters = STATUS_FILTERS;
  protected readonly genderOptions: readonly GuestGender[] = ['MALE', 'FEMALE', 'OTHER'];

  protected readonly createForm: StaffCreateForm = new FormGroup(
    {
      roomTypeId: new FormControl<number | null>(null, [Validators.required, Validators.min(1)]),
      checkIn: new FormControl(todayDisplayDate(), {
        nonNullable: true,
        validators: [Validators.required, displayDateValidator, dateNotInPastValidator],
      }),
      checkOut: new FormControl(tomorrowDisplayDate(), {
        nonNullable: true,
        validators: [Validators.required, displayDateValidator, dateNotInPastValidator],
      }),
      firstName: new FormControl('', { nonNullable: true, validators: [Validators.required, nonBlankValidator, Validators.maxLength(100)] }),
      lastName: new FormControl('', { nonNullable: true, validators: [Validators.required, nonBlankValidator, Validators.maxLength(100)] }),
      email: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, nonBlankValidator, Validators.email, Validators.maxLength(255)],
      }),
      phone: new FormControl('', { nonNullable: true, validators: [Validators.required, nonBlankValidator, Validators.maxLength(32)] }),
      stayingGuests: new FormArray<StaffGuestFormGroup>([createGuestGroup()]),
    },
    {
      validators: [
        checkOutAfterCheckInIsoValidator,
        atLeastOneAdultGuestValidator,
        (control) => this.staffRoomCapacityValidator(control),
      ],
    },
  );

  protected readonly roomTypeById = computed(
    () => new Map(this.roomTypes().map((roomType) => [roomType.roomTypeId, roomType])),
  );

  protected readonly roomById = computed(
    () => new Map(this.rooms().map((room) => [room.roomId, room])),
  );

  protected readonly serviceById = computed(
    () => new Map(this.hotelServices().map((service) => [service.serviceOfferingId, service])),
  );

  protected readonly activeServices = computed(() => this.hotelServices().filter((service) => service.active));

  protected readonly heroStats = computed(() => {
    const reservations = this.reservations();
    const today = todayIsoDate();
    return [
      {
        label: 'Today check-ins',
        value: reservations.filter(
          (reservation) =>
            reservation.checkIn === today &&
            (reservation.status === 'PENDING' || reservation.status === 'CONFIRMED'),
        ).length,
      },
      {
        label: 'In-house guests',
        value: reservations
          .filter((reservation) => reservation.status === 'CHECKED_IN')
          .reduce((sum, reservation) => sum + this.occupantCount(reservation), 0),
      },
      {
        label: 'Pending',
        value: reservations.filter((reservation) => reservation.status === 'PENDING').length,
      },
      {
        label: 'Departures today',
        value: reservations.filter(
          (reservation) => reservation.checkOut === today && reservation.status === 'CHECKED_IN',
        ).length,
      },
    ];
  });

  protected readonly filteredReservations = computed(() => {
    const status = this.statusFilter();
    const query = this.searchTerm().trim().toLowerCase();
    const sort = this.sortMode();

    const filtered = this.reservations().filter((reservation) => {
      if (status !== 'ALL' && reservation.status !== status) return false;
      if (!query) return true;

      const haystack = [
        reservation.reservationId,
        this.guestTitle(reservation),
        reservation.contactEmail ?? '',
        reservation.contactPhone ?? '',
        this.roomTypeName(reservation.roomTypeId),
        this.roomNumber(reservation.roomId),
        reservation.status,
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(query);
    });

    return filtered.sort((a, b) => this.compareReservations(a, b, sort));
  });

  protected readonly roomStats = computed(() =>
    ROOM_STATUSES.map((status) => ({
      status,
      label: STATUS_LABELS[status],
      count: this.rooms().filter((room) => room.status === status).length,
    })),
  );

  protected readonly roomsByFloor = computed<RoomFloor[]>(() => {
    const floors = new Map<number, RoomOperation[]>();

    for (const room of this.rooms()) {
      const floor = floorFromRoomNumber(room.roomNumber);
      floors.set(floor, [...(floors.get(floor) ?? []), room]);
    }

    return [...floors.entries()]
      .sort(([a], [b]) => b - a)
      .map(([floor, rooms]) => ({
        floor,
        label: floor > 0 ? `Floor ${floor}` : 'Unassigned floor',
        rooms: rooms.sort((a, b) => a.roomNumber.localeCompare(b.roomNumber, undefined, { numeric: true })),
      }));
  });

  protected readonly selectedRoomReservation = computed(() => {
    const room = this.selectedRoom();
    if (!room) return null;

    return (
      this.reservations().find(
        (reservation) => reservation.status === 'CHECKED_IN' && reservation.roomId === room.roomId,
      ) ?? null
    );
  });

  protected readonly selectedRoomType = computed(() => {
    const room = this.selectedRoom();
    return room ? this.roomTypeById().get(room.roomTypeId) ?? null : null;
  });

  constructor() {
    this.loadPage();

    // When the staff member picks a different room type, clear cached availability
    // so the calendar re-fetches and shows correct occupied dates.
    this.createForm.controls.roomTypeId.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
        this.loadedAvailabilityWindows.clear();
        this.availabilityByDate.set({});
        if (this.lastVisibleRange) {
          this.fetchAvailabilityWindow(this.lastVisibleRange);
        }
      });
  }

  protected get stayingGuests(): FormArray<StaffGuestFormGroup> {
    return this.createForm.controls.stayingGuests;
  }

  protected reload(): void {
    this.loadPage();
  }

  protected setStatusFilter(status: ReservationStatusFilter): void {
    this.statusFilter.set(status);
  }

  protected updateSearchTerm(event: Event): void {
    this.searchTerm.set((event.target as HTMLInputElement).value);
  }

  protected updateSortMode(event: Event): void {
    this.sortMode.set((event.target as HTMLSelectElement).value as ReservationSortMode);
  }

  protected setViewMode(mode: ReservationViewMode): void {
    this.viewMode.set(mode);
  }

  protected openCreateModal(): void {
    this.createProblem.set(null);
    this.createFormError.set('');
    this.ensureDefaultRoomType();
    this.createModalOpen.set(true);
  }

  protected closeCreateModal(): void {
    if (this.creatingReservation()) return;
    this.createModalOpen.set(false);
  }

  /** Called by DateRangePicker when its visible 2-month window changes. */
  protected onPickerRangeChange(range: { fromIso: string; toIso: string }): void {
    this.lastVisibleRange = range;
    this.fetchAvailabilityWindow(range);
  }

  private fetchAvailabilityWindow(range: { fromIso: string; toIso: string }): void {
    const hotelId = this.hotelId();
    const roomTypeId = Number(this.createForm.controls.roomTypeId.value);
    if (!hotelId || !roomTypeId) return;

    const windowKey = `${hotelId}|${roomTypeId}|${range.fromIso}|${range.toIso}`;
    if (this.loadedAvailabilityWindows.has(windowKey)) return;
    this.loadedAvailabilityWindows.add(windowKey);

    this.staysFacade
      .getAvailabilityCalendar(hotelId, roomTypeId, range.fromIso, range.toIso)
      .subscribe({
        next: (days) => this.mergeAvailability(days),
        error: () => {
          // Soft-fail: keep existing data, backend re-validates on submit.
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

  protected addStayingGuest(): void {
    if (!this.canAddStayingGuest()) {
      this.createForm.markAsTouched();
      this.createForm.updateValueAndValidity();
      return;
    }

    this.stayingGuests.push(createGuestGroup());
    this.createForm.markAsDirty();
    this.createForm.updateValueAndValidity();
  }

  protected removeStayingGuest(index: number): void {
    if (this.stayingGuests.length <= 1) return;
    this.stayingGuests.removeAt(index);
    this.createForm.markAsDirty();
    this.createForm.updateValueAndValidity();
  }

  protected updateSelectedServices(selections: ReservationServiceSelection[]): void {
    this.selectedServices.set(selections);
  }

  protected copyContactToGuest(index: number): void {
    const group = this.stayingGuests.at(index);
    if (!group) return;

    group.patchValue({
      firstName: this.createForm.controls.firstName.value,
      lastName: this.createForm.controls.lastName.value,
    });
    group.markAsDirty();
    group.markAllAsTouched();
  }

  protected formatStaffPhoneInput(): void {
    const control = this.createForm.controls.phone;
    const raw = control.value ?? '';
    const formatted = formatInternationalPhone(raw);
    if (formatted !== raw) {
      control.setValue(formatted, { emitEvent: false });
    }
  }

  protected showControlError(control: AbstractControl, error: string): boolean {
    return control.touched && control.hasError(error);
  }

  protected hasCreateFormError(error: string): boolean {
    return this.createForm.touched && this.createForm.hasError(error);
  }

  protected createCapacityError(): string {
    const error = this.createForm.getError('roomCapacity') as CapacityFormError | null;
    return this.createForm.touched || this.createForm.dirty ? (error?.message ?? '') : '';
  }

  protected canAddStayingGuest(): boolean {
    const roomType = this.selectedCreateRoomType();
    if (!roomType) return true;

    const policy = this.createBookingPolicy(roomType);
    const maxOccupants = policy.maxTotalGuests + (policy.childrenAllowed ? policy.maxInfants : 0);
    return maxOccupants <= 0 || this.stayingGuests.length < maxOccupants;
  }

  protected selectedCreateRoomType(): HotelRoomType | null {
    const roomTypeId = this.createForm.controls.roomTypeId.value;
    return this.findRoomType(Number(roomTypeId));
  }

  protected createRoomCapacityHint(): string {
    const roomType = this.selectedCreateRoomType();
    if (!roomType) return 'Select a room type to see its guest limits.';

    const parts = [
      `up to ${plural(roomType.maxAdults, 'adult')}`,
      `up to ${plural(roomType.maxTotalGuests, 'guest')} excluding infants`,
    ];

    if (roomType.maxChildren > 0) parts.push(`up to ${plural(roomType.maxChildren, 'child', 'children')}`);
    if (roomType.maxInfants > 0) parts.push(`up to ${plural(roomType.maxInfants, 'infant')}`);

    return `${roomType.name}: ${parts.join(' · ')}.`;
  }

  protected guestAgeLabel(group: StaffGuestFormGroup): string {
    const age = Number(group.controls.age.value);
    if (!Number.isFinite(age)) return 'Age pending';

    const roomType = this.selectedCreateRoomType();
    const policy = roomType ? this.createBookingPolicy(roomType) : UNKNOWN_BOOKING_POLICY;
    if (age >= 18) return 'Adult guest';

    switch (ageGroup(age, policy)) {
      case 'infant':
        return 'Infant guest';
      case 'adult-equivalent-minor':
        return 'Teen guest · counts as adult';
      default:
        return 'Child guest';
    }
  }

  protected submitCreateReservation(): void {
    this.createForm.markAllAsTouched();
    this.createProblem.set(null);
    this.createFormError.set('');

    const hotelId = this.hotelId();
    if (!hotelId) {
      this.createFormError.set('Hotel context is unavailable. Refresh the staff desk and try again.');
      return;
    }

    if (this.createForm.invalid) {
      this.createFormError.set('Fill in the required fields before creating a staff reservation.');
      return;
    }

    const stayingGuests = this.normalizedStayingGuests();
    if (stayingGuests.length < 1) {
      this.createFormError.set('Add at least one staying guest.');
      return;
    }

    const value = this.createForm.getRawValue();
    const checkIn = parseDisplayDate(value.checkIn);
    const checkOut = parseDisplayDate(value.checkOut);

    if (!checkIn || !checkOut) {
      this.createFormError.set('Check-in and check-out dates must use DD.MM.YYYY.');
      return;
    }

    const serviceOfferings = this.selectedServices();
    const request: StaffCreateReservationRequest = {
      hotelId,
      roomTypeId: Number(value.roomTypeId),
      firstName: value.firstName.trim(),
      lastName: value.lastName.trim(),
      email: value.email.trim(),
      phone: value.phone.trim(),
      checkIn,
      checkOut,
      stayingGuests,
      serviceOfferings: serviceOfferings.length ? serviceOfferings : undefined,
    };

    this.creatingReservation.set(true);
    this.staffFacade
      .createReservation(request)
      .pipe(finalize(() => this.creatingReservation.set(false)))
      .subscribe({
        next: (reservation) => {
          this.latestCreatedReservation.set(reservation);
          this.reservations.update((reservations) => sortReservationsByCreated([reservation, ...reservations]));
          this.resetCreateForm();
          this.createModalOpen.set(false);
        },
        error: (error: unknown) => this.createProblem.set(this.problemFromError(error)),
      });
  }

  protected checkIn(reservation: Reservation): void {
    this.runReservationOperation(reservation, () => this.staffFacade.checkInReservation(reservation.reservationId));
  }

  protected checkOut(reservation: Reservation): void {
    this.runReservationOperation(reservation, () => this.staffFacade.checkOutReservation(reservation.reservationId));
  }

  protected markNoShow(reservation: Reservation): void {
    if (this.busyReservationId()) {
      return;
    }

    this.confirmDialog.open({
      title: 'Mark as no-show?',
      message: `This will mark ${this.guestTitle(reservation)} as a no-show and close active stay actions for this reservation.`,
      confirmLabel: 'Mark no-show',
      cancelLabel: 'Keep active',
      busy: () => this.busyReservationId() === reservation.reservationId,
      onConfirm: () =>
        this.runReservationOperation(
          reservation,
          () => this.staffFacade.markNoShowReservation(reservation.reservationId),
          () => this.confirmDialog.close(),
        ),
    });
  }

  protected openRoomDetails(room: RoomOperation): void {
    this.roomStatusProblem.set(null);
    this.selectedRoom.set(room);
  }

  protected closeRoomDetails(): void {
    if (this.roomStatusUpdating()) return;
    this.selectedRoom.set(null);
  }

  protected canUpdateRoomStatus(room: RoomOperation): boolean {
    return room.status !== 'OCCUPIED';
  }

  protected updateRoomStatus(update: RoomStatusUpdate): void {
    const selectedRoom = this.selectedRoom();
    if (!selectedRoom || selectedRoom.roomId !== update.roomId || selectedRoom.status === 'OCCUPIED') {
      return;
    }

    this.roomStatusProblem.set(null);
    this.roomStatusUpdating.set(true);

    this.staffFacade
      .updateRoomStatus(update.roomId, update.status)
      .pipe(finalize(() => this.roomStatusUpdating.set(false)))
      .subscribe({
        next: (updatedRoom) => {
          this.applyRoomUpdate(updatedRoom);
          this.latestUpdatedRoom.set(updatedRoom);
          this.selectedRoom.set(null);
        },
        error: (error: unknown) => this.roomStatusProblem.set(this.problemFromError(error)),
      });
  }

  protected statusLabel(status: string): string {
    return STATUS_LABELS[status] ?? status;
  }

  protected statusCount(status: ReservationStatusFilter): number {
    if (status === 'ALL') return this.reservations().length;
    return this.reservations().filter((reservation) => reservation.status === status).length;
  }

  protected hotelTitle(): string {
    const hotel = this.hotel();
    return hotel ? hotel.name : 'Staff reservations';
  }

  protected hotelSubtitle(): string {
    const hotel = this.hotel();
    if (!hotel) return 'Reservations, arrivals and room map';
    return `${hotel.city}, ${hotel.country} - ${hotel.stars} star hotel`;
  }

  protected guestTitle(reservation: Reservation): string {
    const primaryGuest = reservation.stayingGuests[0];
    if (primaryGuest) return `${primaryGuest.firstName} ${primaryGuest.lastName}`.trim();
    return reservation.contactEmail || `Guest #${reservation.guestId}`;
  }

  protected reservationCode(reservation: Reservation): string {
    return reservation.reservationId.length > 10
      ? reservation.reservationId.slice(0, 10).toUpperCase()
      : reservation.reservationId.toUpperCase();
  }

  protected roomTypeName(roomTypeId: number): string {
    return this.roomTypeById().get(roomTypeId)?.name ?? 'Room type name unavailable';
  }

  protected roomNumber(roomId: number | null): string {
    if (!roomId) return 'Room not assigned';
    return this.roomById().get(roomId)?.roomNumber ?? 'Room number unavailable';
  }

  protected guestSummary(reservation: Reservation): string {
    const stayingGuests = reservation.stayingGuests;
    const adults = stayingGuests.length
      ? stayingGuests.filter((guest) => guest.age >= 18).length
      : reservation.adults;
    const children = stayingGuests.length
      ? stayingGuests.filter((guest) => guest.age < 18).length
      : reservation.childrenAges.length;

    const parts = [plural(adults, 'adult')];
    if (children > 0) parts.push(plural(children, 'child', 'children'));
    return parts.join(', ');
  }

  protected dateRangeLabel(reservation: Reservation): string {
    return `${formatDate(reservation.checkIn)} - ${formatDate(reservation.checkOut)}`;
  }

  protected formatDate(date: string): string {
    return formatDate(date);
  }

  protected priceLabel(reservation: Reservation): string {
    return formatPrice(reservation.finalPriceAmount, reservation.finalPriceCurrency ?? 'EUR');
  }

  protected basePriceLabel(roomType: HotelRoomType): string {
    return `${formatPrice(roomType.basePriceAmount, roomType.basePriceCurrency)} / night`;
  }

  protected roomTypeCapacityLabel(roomType: HotelRoomType): string {
    const guests = plural(roomType.maxTotalGuests, 'guest');
    const infants = roomType.maxInfants > 0 ? ` + ${plural(roomType.maxInfants, 'infant')}` : '';
    return `${guests}${infants}`;
  }

  protected canCheckIn(reservation: Reservation): boolean {
    return isCheckInAllowedReservation(reservation.status);
  }

  protected canCheckOut(reservation: Reservation): boolean {
    return isCheckOutAllowedReservation(reservation.status);
  }

  protected occupantCount(reservation: Reservation): number {
    if (reservation.stayingGuests.length) return reservation.stayingGuests.length;
    return reservation.adults + reservation.childrenAges.length;
  }

  protected selectedNights(): number {
    const { checkIn, checkOut } = this.createForm.getRawValue();
    return nightsBetween(checkIn, checkOut);
  }

  protected preliminaryCurrency(): string {
    const roomTypeId = this.createForm.controls.roomTypeId.value;
    return this.roomTypeById().get(Number(roomTypeId))?.basePriceCurrency ?? this.hotelServices()[0]?.priceCurrency ?? 'EUR';
  }

  protected preliminaryTotalLabel(): string {
    return formatPrice(this.preliminaryTotal(), this.preliminaryCurrency());
  }

  private loadPage(): void {
    this.loading.set(true);
    this.problem.set(null);
    this.lookupProblem.set(null);
    this.accessProblem.set(null);
    this.roomStatusProblem.set(null);
    this.latestUpdatedRoom.set(null);

    this.staffFacade
      .listRooms()
      .pipe(
        catchError((error: unknown) => this.recoverStaffCollection<RoomOperation>(error)),
        switchMap((rooms) => {
          if (this.accessProblem() || this.problem()) {
            return of({ reservations: [] as Reservation[], rooms });
          }

          return this.staffFacade.listReservations(100).pipe(
            catchError((error: unknown) => this.recoverStaffCollection<Reservation>(error)),
            map((reservations) => ({ reservations, rooms })),
          );
        }),
      )
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe(({ reservations, rooms }) => {
        this.reservations.set(sortReservationsByCreated(reservations));
        this.rooms.set(rooms);

        const hotelId = this.resolveHotelId(reservations, rooms);
        this.hotelId.set(hotelId);

        if (!hotelId) {
          this.hotel.set(null);
          this.roomTypes.set([]);
          this.hotelServices.set([]);
          return;
        }

        this.loadHotelLookups(hotelId);
      });
  }

  private recoverStaffCollection<T>(error: unknown) {
    const problem = this.problemFromError(error);
    if (problem.status === 403) {
      this.accessProblem.set(problem);
    } else if (problem.status !== 401) {
      this.problem.set(problem);
    }
    return of<T[]>([]);
  }

  private loadHotelLookups(hotelId: number): void {
    forkJoin({
      hotel: this.hotelsFacade.getHotelDetails(hotelId).pipe(
        catchError((error: unknown) => {
          this.lookupProblem.set(this.problemFromError(error));
          return of<Hotel | null>(null);
        }),
      ),
      roomTypes: this.hotelsFacade.getHotelRoomTypes(hotelId).pipe(
        catchError((error: unknown) => {
          this.lookupProblem.set(this.problemFromError(error));
          return of<HotelRoomType[]>([]);
        }),
      ),
      services: this.hotelsFacade.getHotelServices(hotelId).pipe(
        catchError((error: unknown) => {
          this.lookupProblem.set(this.problemFromError(error));
          return of<HotelServiceOffering[]>([]);
        }),
      ),
    }).subscribe(({ hotel, roomTypes, services }) => {
      this.hotel.set(hotel);
      this.roomTypes.set(roomTypes);
      this.hotelServices.set(services);
      this.ensureDefaultRoomType();
      this.createForm.updateValueAndValidity({ emitEvent: false });
    });
  }

  private runReservationOperation(
    reservation: Reservation,
    operation: () => ReturnType<StaffFacade['checkInReservation']>,
    onSuccess?: () => void,
  ): void {
    this.problem.set(null);
    this.busyReservationId.set(reservation.reservationId);

    operation()
      .pipe(finalize(() => this.busyReservationId.set(null)))
      .subscribe({
        next: (updated) => {
          this.applyReservationUpdate(reservation, updated);
          onSuccess?.();
        },
        error: (error: unknown) => {
          this.confirmDialog.close();
          this.problem.set(this.problemFromError(error));
        },
      });
  }

  private applyReservationUpdate(previous: Reservation, updated: Reservation): void {
    this.reservations.update((reservations) =>
      sortReservationsByCreated(
        reservations.map((reservation) =>
          reservation.reservationId === updated.reservationId ? updated : reservation,
        ),
      ),
    );

    const roomId = updated.roomId ?? previous.roomId;
    const roomStatus = roomStatusFromReservationUpdate(updated.status);
    if (!roomId || !roomStatus) return;

    const currentRoom = this.roomById().get(roomId);
    if (!currentRoom) return;

    this.applyRoomUpdate({ ...currentRoom, status: roomStatus });
  }

  private applyRoomUpdate(updatedRoom: RoomOperation): void {
    this.rooms.update((rooms) =>
      rooms.map((room) => (room.roomId === updatedRoom.roomId ? { ...room, ...updatedRoom } : room)),
    );

    this.selectedRoom.update((room) =>
      room?.roomId === updatedRoom.roomId ? { ...room, ...updatedRoom } : room,
    );
  }

  private resolveHotelId(reservations: readonly Reservation[], rooms: readonly RoomOperation[]): number | null {
    return rooms[0]?.hotelId ?? reservations[0]?.hotelId ?? null;
  }

  private ensureDefaultRoomType(): void {
    if (this.createForm.controls.roomTypeId.value || !this.roomTypes().length) return;
    this.createForm.controls.roomTypeId.setValue(this.roomTypes()[0].roomTypeId);
  }

  private staffRoomCapacityValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value as {
      roomTypeId?: number | null;
      stayingGuests?: Array<{ age?: number | string | null }>;
    };

    const roomType = this.findRoomType(Number(value.roomTypeId));
    if (!roomType) return null;

    const guests = value.stayingGuests ?? [];
    const adults = guests.filter((guest) => Number(guest.age) >= 18).length;
    const childrenAges = guests
      .map((guest) => Number(guest.age))
      .filter((age) => Number.isFinite(age) && age < 18);

    const result = canFitRoom(adults, childrenAges, this.createBookingPolicy(roomType));
    return result.ok ? null : { roomCapacity: { message: result.issue.message } satisfies CapacityFormError };
  }

  private createBookingPolicy(roomType: HotelRoomType): BookingPolicy {
    const hotel = this.hotel();

    return {
      maxAdults: roomType.maxAdults,
      maxChildren: roomType.maxChildren,
      maxInfants: roomType.maxInfants,
      maxTotalGuests: roomType.maxTotalGuests,
      petsAllowed: roomType.petsAllowed,
      maxPets: roomType.maxPets,
      infantMaxAge: hotel?.infantMaxAge ?? UNKNOWN_BOOKING_POLICY.infantMaxAge,
      childMaxAge: hotel?.childMaxAge ?? UNKNOWN_BOOKING_POLICY.childMaxAge,
      adultEquivalentAge: hotel?.adultEquivalentAge ?? UNKNOWN_BOOKING_POLICY.adultEquivalentAge,
      childrenAllowed: hotel?.childrenAllowed ?? UNKNOWN_BOOKING_POLICY.childrenAllowed,
    };
  }

  private findRoomType(roomTypeId: number): HotelRoomType | null {
    if (!Number.isFinite(roomTypeId) || roomTypeId <= 0) return null;
    return this.roomTypes().find((roomType) => roomType.roomTypeId === roomTypeId) ?? null;
  }

  private normalizedStayingGuests(): StayingGuest[] {
    return this.stayingGuests.controls.map((group) => {
      const value = group.getRawValue();
      return {
        firstName: value.firstName.trim(),
        lastName: value.lastName.trim(),
        age: Number(value.age),
        gender: value.gender,
      };
    });
  }

  private resetCreateForm(): void {
    this.createForm.reset({
      roomTypeId: this.roomTypes()[0]?.roomTypeId ?? null,
      checkIn: todayDisplayDate(),
      checkOut: tomorrowDisplayDate(),
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
    });
    this.stayingGuests.clear();
    this.stayingGuests.push(createGuestGroup());
    this.selectedServices.set([]);
    this.createFormError.set('');
    this.createProblem.set(null);
  }

  private preliminaryTotal(): number {
    const roomTypeId = this.createForm.controls.roomTypeId.value;
    const roomType = this.roomTypeById().get(Number(roomTypeId));
    const nights = this.selectedNights();
    const base = roomType ? roomType.basePriceAmount * nights : 0;
    const services = this.selectedServices().reduce((sum, selection) => {
      const service = this.serviceById().get(selection.serviceOfferingId);
      return sum + (service?.priceAmount ?? 0) * selection.quantity;
    }, 0);

    return base + services;
  }

  private problemFromError(error: unknown): ProblemDetail {
    const problem = toProblemDetail(error);
    if (problem.status === 401) {
      this.authService.login('/staff');
    }
    return problem;
  }

  private compareReservations(a: Reservation, b: Reservation, sort: ReservationSortMode): number {
    if (sort === 'checkIn') return a.checkIn.localeCompare(b.checkIn);
    if (sort === 'guest') return this.guestTitle(a).localeCompare(this.guestTitle(b));
    if (sort === 'status') return this.statusLabel(a.status).localeCompare(this.statusLabel(b.status));
    return Date.parse(b.createdAt) - Date.parse(a.createdAt);
  }
}

function createGuestGroup(): StaffGuestFormGroup {
  return new FormGroup({
    firstName: new FormControl('', { nonNullable: true, validators: [Validators.required, nonBlankValidator, Validators.maxLength(100)] }),
    lastName: new FormControl('', { nonNullable: true, validators: [Validators.required, nonBlankValidator, Validators.maxLength(100)] }),
    age: new FormControl(18, { nonNullable: true, validators: [Validators.required, Validators.min(0), Validators.max(130)] }),
    gender: new FormControl<GuestGender>('OTHER', { nonNullable: true, validators: [Validators.required] }),
  });
}

function nonBlankValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  return typeof value === 'string' && value.trim().length === 0 ? { required: true } : null;
}

function atLeastOneAdultGuestValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value as { stayingGuests?: Array<{ age?: number | string | null }> };
  const stayingGuests = value.stayingGuests ?? [];
  return stayingGuests.some((guest) => Number(guest.age) >= 18) ? null : { adultGuestRequired: true };
}

function checkOutAfterCheckInIsoValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value as { checkIn?: string; checkOut?: string };
  if (!value.checkIn || !value.checkOut) return null;
  return nightsBetween(value.checkIn, value.checkOut) > 0 ? null : { dateRange: true };
}

function roomStatusFromReservationUpdate(status: ReservationStatus): RoomStatus | null {
  if (status === 'CHECKED_IN') return 'OCCUPIED';
  if (status === 'CHECKED_OUT') return 'CLEANING';
  return null;
}

function sortReservationsByCreated(reservations: readonly Reservation[]): Reservation[] {
  return [...reservations].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

function floorFromRoomNumber(roomNumber: string): number {
  const digits = roomNumber.match(/\d+/)?.[0] ?? '';
  if (digits.length <= 2) return 0;
  const floor = Number(digits.slice(0, -2));
  return Number.isFinite(floor) ? floor : 0;
}

function formatDate(date: string): string {
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(
    new Date(`${date}T00:00:00`),
  );
}

function formatPrice(amount: number | null | undefined, currency: string | null | undefined): string {
  if (amount === null || amount === undefined) return 'Price pending';
  return `${currency ?? 'EUR'} ${amount.toFixed(2)}`;
}

function plural(value: number, singular: string, pluralLabel = `${singular}s`): string {
  return `${value} ${value === 1 ? singular : pluralLabel}`;
}

function nightsBetween(checkIn: string, checkOut: string): number {
  const checkInIso = parseDisplayDate(checkIn) ?? checkIn;
  const checkOutIso = parseDisplayDate(checkOut) ?? checkOut;
  const start = Date.parse(`${checkInIso}T00:00:00`);
  const end = Date.parse(`${checkOutIso}T00:00:00`);
  if (!Number.isFinite(start) || !Number.isFinite(end)) return 0;
  return Math.max(0, Math.round((end - start) / MS_PER_DAY));
}

function todayIsoDate(): string {
  return toLocalIsoDate(new Date());
}

function toLocalIsoDate(date: Date): string {
  const copy = new Date(date);
  copy.setMinutes(copy.getMinutes() - copy.getTimezoneOffset());
  return copy.toISOString().slice(0, 10);
}
