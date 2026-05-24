import { Component, computed, inject, signal } from '@angular/core';
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
import { ErrorMessage } from '../../../../shared/ui/error-message/error-message';
import { LoadingState } from '../../../../shared/ui/loading-state/loading-state';
import { StatusBadge } from '../../../../shared/ui/status-badge/status-badge';
import { Hotel, HotelRoomType, HotelServiceOffering } from '../../../hotels/model/hotel.model';
import {
  Reservation,
  ReservationServiceSelection,
  ReservationStatus,
  StayingGuest,
  isCheckInAllowedReservation,
  isCheckOutAllowedReservation,
} from '../../../reservations/model/reservation.model';
import { HotelsFacade } from '../../../hotels/services/hotels.facade';
import { RoomOperation, RoomStatus } from '../../model/room-operation.model';
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

interface RoomFloor {
  floor: number;
  label: string;
  rooms: RoomOperation[];
}

interface ServiceLine {
  serviceOfferingId: number;
  name: string;
  quantity: number;
  priceLabel: string;
  totalLabel: string;
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
  imports: [ReactiveFormsModule, ErrorMessage, LoadingState, StatusBadge],
  templateUrl: './staff-dashboard-page.html',
  styleUrl: './staff-dashboard-page.scss',
})
export class StaffDashboardPage {
  private readonly staffFacade = inject(StaffFacade);
  private readonly hotelsFacade = inject(HotelsFacade);
  private readonly authService = inject(AuthService);

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
  protected readonly creatingReservation = signal(false);
  protected readonly createProblem = signal<ProblemDetail | null>(null);
  protected readonly createFormError = signal('');
  protected readonly latestCreatedReservation = signal<Reservation | null>(null);

  protected readonly statusFilter = signal<ReservationStatusFilter>('ALL');
  protected readonly searchTerm = signal('');
  protected readonly sortMode = signal<ReservationSortMode>('newest');
  protected readonly viewMode = signal<ReservationViewMode>('list');
  protected readonly selectedRoom = signal<RoomOperation | null>(null);
  protected readonly createModalOpen = signal(false);
  protected readonly selectedServices = signal<ReservationServiceSelection[]>([]);

  protected readonly statusFilters = STATUS_FILTERS;
  protected readonly genderOptions: readonly GuestGender[] = ['MALE', 'FEMALE', 'OTHER'];
  protected readonly serviceOfferingId = new FormControl<number | null>(null);
  protected readonly serviceQuantity = new FormControl(1, {
    nonNullable: true,
    validators: [Validators.required, Validators.min(1)],
  });

  protected readonly createForm: StaffCreateForm = new FormGroup(
    {
      roomTypeId: new FormControl<number | null>(null, [Validators.required, Validators.min(1)]),
      checkIn: new FormControl(todayIsoDate(), { nonNullable: true, validators: [Validators.required] }),
      checkOut: new FormControl(addIsoDays(todayIsoDate(), 1), { nonNullable: true, validators: [Validators.required] }),
      firstName: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(100)] }),
      lastName: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(100)] }),
      email: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.email, Validators.maxLength(255)],
      }),
      phone: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(32)] }),
      stayingGuests: new FormArray<StaffGuestFormGroup>([createGuestGroup()]),
    },
    { validators: [checkOutAfterCheckInIsoValidator] },
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

  protected readonly selectedServiceLines = computed<ServiceLine[]>(() =>
    this.selectedServices().map((selection) => {
      const service = this.serviceById().get(selection.serviceOfferingId);
      const price = service?.priceAmount ?? 0;
      const currency = service?.priceCurrency ?? this.preliminaryCurrency();

      return {
        serviceOfferingId: selection.serviceOfferingId,
        name: service?.name ?? 'Service unavailable',
        quantity: selection.quantity,
        priceLabel: formatPrice(price, currency),
        totalLabel: formatPrice(price * selection.quantity, currency),
      };
    }),
  );

  constructor() {
    this.loadPage();
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

  protected addStayingGuest(): void {
    this.stayingGuests.push(createGuestGroup());
  }

  protected removeStayingGuest(index: number): void {
    if (this.stayingGuests.length <= 1) return;
    this.stayingGuests.removeAt(index);
  }

  protected addService(): void {
    const serviceOfferingId = this.serviceOfferingId.value;
    const quantity = Number(this.serviceQuantity.value);

    if (!serviceOfferingId || !Number.isFinite(quantity) || quantity < 1) return;

    this.selectedServices.update((items) => {
      const existing = items.find((item) => item.serviceOfferingId === serviceOfferingId);
      if (existing) {
        return items.map((item) =>
          item.serviceOfferingId === serviceOfferingId ? { ...item, quantity: item.quantity + quantity } : item,
        );
      }

      return [...items, { serviceOfferingId, quantity }];
    });

    this.serviceOfferingId.setValue(null);
    this.serviceQuantity.setValue(1);
  }

  protected removeService(serviceOfferingId: number): void {
    this.selectedServices.update((items) => items.filter((item) => item.serviceOfferingId !== serviceOfferingId));
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
      this.createFormError.set('Fill in the required fields and make sure check-out is after check-in.');
      return;
    }

    const stayingGuests = this.normalizedStayingGuests();
    if (stayingGuests.length < 1) {
      this.createFormError.set('Add at least one staying guest.');
      return;
    }

    if (!stayingGuests.some((guest) => guest.age >= 18)) {
      this.createFormError.set('At least one staying guest must be an adult.');
      return;
    }

    const value = this.createForm.getRawValue();
    const serviceOfferings = this.selectedServices();
    const request: StaffCreateReservationRequest = {
      hotelId,
      roomTypeId: Number(value.roomTypeId),
      firstName: value.firstName.trim(),
      lastName: value.lastName.trim(),
      email: value.email.trim(),
      phone: value.phone.trim(),
      checkIn: value.checkIn,
      checkOut: value.checkOut,
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
    if (!window.confirm('Mark this reservation as no-show?')) return;
    this.runReservationOperation(reservation, () => this.staffFacade.markNoShowReservation(reservation.reservationId));
  }

  protected openRoomDetails(room: RoomOperation): void {
    if (room.status !== 'OCCUPIED') return;
    this.selectedRoom.set(room);
  }

  protected closeRoomDetails(): void {
    this.selectedRoom.set(null);
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

  protected servicePriceLabel(service: HotelServiceOffering): string {
    return formatPrice(service.priceAmount, service.priceCurrency);
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
    });
  }

  private runReservationOperation(
    reservation: Reservation,
    operation: () => ReturnType<StaffFacade['checkInReservation']>,
  ): void {
    this.problem.set(null);
    this.busyReservationId.set(reservation.reservationId);

    operation()
      .pipe(finalize(() => this.busyReservationId.set(null)))
      .subscribe({
        next: (updated) => this.applyReservationUpdate(reservation, updated),
        error: (error: unknown) => this.problem.set(this.problemFromError(error)),
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

    this.rooms.update((rooms) =>
      rooms.map((room) => (room.roomId === roomId ? { ...room, status: roomStatus } : room)),
    );
  }

  private resolveHotelId(reservations: readonly Reservation[], rooms: readonly RoomOperation[]): number | null {
    return rooms[0]?.hotelId ?? reservations[0]?.hotelId ?? null;
  }

  private ensureDefaultRoomType(): void {
    if (this.createForm.controls.roomTypeId.value || !this.roomTypes().length) return;
    this.createForm.controls.roomTypeId.setValue(this.roomTypes()[0].roomTypeId);
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
      checkIn: todayIsoDate(),
      checkOut: addIsoDays(todayIsoDate(), 1),
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
    });
    this.stayingGuests.clear();
    this.stayingGuests.push(createGuestGroup());
    this.selectedServices.set([]);
    this.serviceOfferingId.setValue(null);
    this.serviceQuantity.setValue(1);
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
    firstName: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(100)] }),
    lastName: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(100)] }),
    age: new FormControl(18, { nonNullable: true, validators: [Validators.required, Validators.min(0), Validators.max(130)] }),
    gender: new FormControl<GuestGender>('OTHER', { nonNullable: true, validators: [Validators.required] }),
  });
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
  const start = Date.parse(`${checkIn}T00:00:00`);
  const end = Date.parse(`${checkOut}T00:00:00`);
  if (!Number.isFinite(start) || !Number.isFinite(end)) return 0;
  return Math.max(0, Math.round((end - start) / MS_PER_DAY));
}

function todayIsoDate(): string {
  return toLocalIsoDate(new Date());
}

function addIsoDays(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00`);
  date.setDate(date.getDate() + days);
  return toLocalIsoDate(date);
}

function toLocalIsoDate(date: Date): string {
  const copy = new Date(date);
  copy.setMinutes(copy.getMinutes() - copy.getTimezoneOffset());
  return copy.toISOString().slice(0, 10);
}
