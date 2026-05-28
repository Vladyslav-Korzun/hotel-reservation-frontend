import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Observable, finalize, forkJoin } from 'rxjs';
import { toProblemDetail } from '../../../../core/http/api-error.util';
import { ProblemDetail } from '../../../../core/http/problem-detail.model';
import { ConfirmDialogOutlet, ConfirmDialogService } from '../../../../shared/ui/confirm-dialog/confirm-dialog';
import { ErrorMessage } from '../../../../shared/ui/error-message/error-message';
import { LoadingState } from '../../../../shared/ui/loading-state/loading-state';
import { Hotel } from '../../../hotels/model/hotel.model';
import { HotelsFacade } from '../../../hotels/services/hotels.facade';
import { HotelAdminCommand, HotelAdminForm } from '../../components/hotel-admin-form/hotel-admin-form';
import { RoomAdminCommand, RoomAdminForm } from '../../components/room-admin-form/room-admin-form';
import { RoomTypeAdminCommand, RoomTypeAdminForm } from '../../components/room-type-admin-form/room-type-admin-form';
import {
  ServiceOfferingAdminCommand,
  ServiceOfferingAdminForm,
} from '../../components/service-offering-admin-form/service-offering-admin-form';
import {
  StaffAssignmentTable,
  StaffHotelAssignment,
} from '../../components/staff-assignment-table/staff-assignment-table';
import { AuditDatePicker } from '../../components/audit-date-picker/audit-date-picker';
import { AuditApi } from '../../api/audit.api';
import { AuditActionType, AuditEntityType, AuditLogEntryDto } from '../../api/audit.dto';
import { AdminStaff } from '../../model/admin.model';
import { AdminFacade } from '../../services/admin.facade';

type AdminResource = 'hotels' | 'roomTypes' | 'rooms' | 'services' | 'staff' | 'auditLog';

@Component({
  selector: 'app-admin-dashboard-page',
  imports: [
    DatePipe,
    ErrorMessage,
    LoadingState,
    HotelAdminForm,
    RoomAdminForm,
    RoomTypeAdminForm,
    ServiceOfferingAdminForm,
    StaffAssignmentTable,
    AuditDatePicker,
    ConfirmDialogOutlet,
  ],
  templateUrl: './admin-dashboard-page.html',
  styleUrl: './admin-dashboard-page.scss',
})
export class AdminDashboardPage implements OnInit {
  private readonly adminFacade = inject(AdminFacade);
  private readonly hotelsFacade = inject(HotelsFacade);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly auditApi = inject(AuditApi);

  protected readonly activeResource = signal<AdminResource>('staff');
  protected readonly busyResource = signal<AdminResource | null>(null);
  protected readonly problem = signal<ProblemDetail | null>(null);
  protected readonly latestResult = signal<unknown | null>(null);
  protected readonly staffAssignments = signal<AdminStaff[]>([]);
  protected readonly staffHotels = signal<Hotel[]>([]);
  protected readonly loadingStaffAssignments = signal(false);
  protected readonly staffProblem = signal<ProblemDetail | null>(null);
  protected readonly busyStaffId = signal<number | null>(null);
  private readonly staffAssignmentsLoaded = signal(false);

  // Audit log
  protected readonly auditEntries = signal<AuditLogEntryDto[]>([]);
  protected readonly auditLoading = signal(false);
  protected readonly auditProblem = signal<ProblemDetail | null>(null);
  protected readonly auditLimit = signal(50);
  protected readonly auditLimitOptions = [50, 100, 200] as const;
  private readonly auditLoaded = signal(false);

  protected readonly auditSearchQuery = signal('');
  protected readonly auditSearchDate = signal('');
  protected readonly auditExpandedId = signal<number | null>(null);

  protected readonly filteredAuditEntries = computed(() => {
    const q = this.auditSearchQuery().trim().toLowerCase();
    const d = this.auditSearchDate();
    return this.auditEntries().filter(e => {
      const matchesQuery =
        !q ||
        e.actorId.toLowerCase().includes(q) ||
        e.actorRole.toLowerCase().includes(q) ||
        e.actionType.toLowerCase().replace(/_/g, ' ').includes(q) ||
        e.entityType.toLowerCase().includes(q) ||
        e.details.toLowerCase().includes(q);
      const matchesDate = !d || e.timestamp.startsWith(d);
      return matchesQuery && matchesDate;
    });
  });

  protected readonly resources: readonly { key: AdminResource; label: string }[] = [
    { key: 'staff', label: 'Staff' },
    { key: 'auditLog', label: 'Audit Log' },
  ];

  ngOnInit(): void {
    this.loadStaffAssignments();
  }

  protected selectResource(resource: AdminResource): void {
    this.activeResource.set(resource);

    if (resource === 'staff' && !this.staffAssignmentsLoaded()) {
      this.loadStaffAssignments();
    }
    if (resource === 'auditLog' && !this.auditLoaded()) {
      this.loadAuditLog();
    }
  }

  protected submitHotel(command: HotelAdminCommand): void {
    const request =
      command.mode === 'create'
        ? this.adminFacade.createHotel(command.request)
        : this.adminFacade.updateHotel(command.hotelId, command.request);

    this.runAdminRequest('hotels', request);
  }

  protected submitRoomType(command: RoomTypeAdminCommand): void {
    const request =
      command.mode === 'create'
        ? this.adminFacade.createRoomType(command.request)
        : this.adminFacade.updateRoomType(command.roomTypeId, command.request);

    this.runAdminRequest('roomTypes', request);
  }

  protected submitRoom(command: RoomAdminCommand): void {
    const request =
      command.mode === 'create'
        ? this.adminFacade.createRoom(command.request)
        : this.adminFacade.updateRoom(command.roomId, command.request);

    this.runAdminRequest('rooms', request);
  }

  protected submitService(command: ServiceOfferingAdminCommand): void {
    if (command.mode === 'deactivate') {
      this.confirmDialog.open({
        title: 'Deactivate service offering?',
        message: 'Guests will no longer be able to add this service to new reservations.',
        confirmLabel: 'Deactivate service',
        cancelLabel: 'Keep service',
        busy: () => this.isBusy('services'),
        onConfirm: () => this.executeServiceCommand(command, () => this.confirmDialog.close()),
      });
      return;
    }

    this.executeServiceCommand(command);
  }

  protected unassignStaffFromHotel(staffId: number): void {
    if (this.busyStaffId()) {
      return;
    }

    this.confirmDialog.open({
      title: 'Unassign staff member?',
      message: 'This staff account will lose access to hotel staff operations until an administrator assigns a hotel again.',
      confirmLabel: 'Unassign staff',
      cancelLabel: 'Keep assignment',
      busy: () => this.busyStaffId() === staffId,
      onConfirm: () => this.confirmStaffUnassignment(staffId),
    });
  }

  private confirmStaffUnassignment(staffId: number): void {
    if (this.busyStaffId()) {
      return;
    }

    this.staffProblem.set(null);
    this.busyStaffId.set(staffId);

    this.adminFacade
      .unassignStaffFromHotel(staffId)
      .pipe(finalize(() => this.busyStaffId.set(null)))
      .subscribe({
        next: (updatedStaff) => {
          this.latestResult.set(updatedStaff);
          this.confirmDialog.close();
          this.staffAssignments.update((items) =>
            items.map((item) => (item.id === updatedStaff.id ? updatedStaff : item)),
          );
        },
        error: (error: unknown) => {
          this.confirmDialog.close();
          this.staffProblem.set(toProblemDetail(error));
        },
      });
  }

  private executeServiceCommand(command: ServiceOfferingAdminCommand, onSuccess?: () => void): void {
    const request =
      command.mode === 'create'
        ? this.adminFacade.createServiceOffering(command.hotelId, command.request)
        : command.mode === 'update'
          ? this.adminFacade.updateServiceOffering(command.hotelId, command.serviceId, command.request)
          : this.adminFacade.deactivateServiceOffering(command.hotelId, command.serviceId);

    this.runAdminRequest(
      'services',
      request,
      command.mode === 'deactivate' ? { deactivated: true } : undefined,
      onSuccess,
    );
  }

  protected reloadStaffAssignments(): void {
    this.loadStaffAssignments();
  }

  protected assignStaffToHotel(assignment: StaffHotelAssignment): void {
    this.staffProblem.set(null);
    this.busyStaffId.set(assignment.staffId);

    this.adminFacade
      .assignStaffToHotel(assignment.staffId, { hotelId: assignment.hotelId })
      .pipe(finalize(() => this.busyStaffId.set(null)))
      .subscribe({
        next: (updatedStaff) => {
          this.latestResult.set(updatedStaff);
          this.staffAssignments.update((items) =>
            items.map((item) => (item.id === updatedStaff.id ? updatedStaff : item)),
          );
        },
        error: (error: unknown) => this.staffProblem.set(toProblemDetail(error)),
      });
  }

  protected loadAuditLog(): void {
    this.auditProblem.set(null);
    this.auditLoading.set(true);

    this.auditApi
      .getAuditLog(this.auditLimit())
      .pipe(finalize(() => this.auditLoading.set(false)))
      .subscribe({
        next: (data) => {
          this.auditEntries.set(data);
          this.auditLoaded.set(true);
        },
        error: (err: unknown) => this.auditProblem.set(toProblemDetail(err)),
      });
  }

  protected changeAuditLimit(value: number): void {
    this.auditLimit.set(value);
    this.auditLoaded.set(false);
    this.loadAuditLog();
  }

  protected auditActionCategory(action: AuditActionType): string {
    if (action.startsWith('CREATE_')) return 'create';
    if (action.startsWith('UPDATE_')) return 'update';
    if (action === 'CANCEL_RESERVATION' || action === 'MARK_NO_SHOW' || action === 'DEACTIVATE_SERVICE_OFFERING')
      return 'danger';
    return 'neutral';
  }

  protected auditEntityIconPath(entity: AuditEntityType): string {
    const map: Record<AuditEntityType, string> = {
      HOTEL:            'M3 21h18M3 10h18M3 7l9-4 9 4M4 10v11M20 10v11M8 14h.01M8 18h.01M12 14h.01M12 18h.01M16 14h.01M16 18h.01',
      ROOM:             'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
      ROOM_TYPE:        'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
      RESERVATION:      'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
      SERVICE_OFFERING: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
      GUEST:            'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
    };
    return map[entity] ?? 'M12 12h.01';
  }

  protected toggleAuditExpand(id: number): void {
    this.auditExpandedId.update(cur => (cur === id ? null : id));
  }

  protected shortId(id: string): string {
    return id.length > 8 ? id.slice(0, 8) + '…' : id;
  }

  protected isBusy(resource: AdminResource): boolean {
    return this.busyResource() === resource;
  }

  protected formatResult(result: unknown): string {
    return JSON.stringify(result, null, 2);
  }

  private loadStaffAssignments(): void {
    this.staffProblem.set(null);
    this.loadingStaffAssignments.set(true);

    forkJoin({
      staff: this.adminFacade.listStaff(),
      hotels: this.hotelsFacade.listHotels(),
    })
      .pipe(finalize(() => this.loadingStaffAssignments.set(false)))
      .subscribe({
        next: ({ staff, hotels }) => {
          this.staffAssignments.set(staff);
          this.staffHotels.set(hotels);
          this.staffAssignmentsLoaded.set(true);
        },
        error: (error: unknown) => {
          this.staffAssignments.set([]);
          this.staffProblem.set(toProblemDetail(error));
        },
      });
  }

  private runAdminRequest(
    resource: AdminResource,
    request: Observable<unknown>,
    emptyResult?: unknown,
    onSuccess?: () => void,
  ): void {
    this.problem.set(null);
    this.latestResult.set(null);
    this.busyResource.set(resource);

    request.pipe(finalize(() => this.busyResource.set(null))).subscribe({
      next: (result) => {
        this.latestResult.set(result ?? emptyResult ?? { ok: true });
        onSuccess?.();
      },
      error: (error: unknown) => {
        this.confirmDialog.close();
        this.problem.set(toProblemDetail(error));
      },
    });
  }
}
