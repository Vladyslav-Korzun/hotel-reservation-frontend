import { Component, inject, signal } from '@angular/core';
import { Observable, finalize } from 'rxjs';
import { toProblemDetail } from '../../../../core/http/api-error.util';
import { ProblemDetail } from '../../../../core/http/problem-detail.model';
import { ErrorMessage } from '../../../../shared/ui/error-message/error-message';
import { HotelAdminCommand, HotelAdminForm } from '../../components/hotel-admin-form/hotel-admin-form';
import { RoomAdminCommand, RoomAdminForm } from '../../components/room-admin-form/room-admin-form';
import { RoomTypeAdminCommand, RoomTypeAdminForm } from '../../components/room-type-admin-form/room-type-admin-form';
import {
  ServiceOfferingAdminCommand,
  ServiceOfferingAdminForm,
} from '../../components/service-offering-admin-form/service-offering-admin-form';
import { AdminFacade } from '../../services/admin.facade';

type AdminResource = 'hotels' | 'roomTypes' | 'rooms' | 'services';

@Component({
  selector: 'app-admin-dashboard-page',
  imports: [ErrorMessage, HotelAdminForm, RoomAdminForm, RoomTypeAdminForm, ServiceOfferingAdminForm],
  templateUrl: './admin-dashboard-page.html',
  styleUrl: './admin-dashboard-page.scss',
})
export class AdminDashboardPage {
  private readonly adminFacade = inject(AdminFacade);

  protected readonly activeResource = signal<AdminResource>('hotels');
  protected readonly busyResource = signal<AdminResource | null>(null);
  protected readonly problem = signal<ProblemDetail | null>(null);
  protected readonly latestResult = signal<unknown | null>(null);
  protected readonly resources: readonly { key: AdminResource; label: string }[] = [
    { key: 'hotels', label: 'Hotels' },
    { key: 'roomTypes', label: 'Room types' },
    { key: 'rooms', label: 'Rooms' },
    { key: 'services', label: 'Services' },
  ];

  protected selectResource(resource: AdminResource): void {
    this.activeResource.set(resource);
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
    if (command.mode === 'deactivate' && !window.confirm('Deactivate this service offering?')) {
      return;
    }

    const request =
      command.mode === 'create'
        ? this.adminFacade.createServiceOffering(command.hotelId, command.request)
        : command.mode === 'update'
          ? this.adminFacade.updateServiceOffering(command.hotelId, command.serviceId, command.request)
          : this.adminFacade.deactivateServiceOffering(command.hotelId, command.serviceId);

    this.runAdminRequest('services', request, command.mode === 'deactivate' ? { deactivated: true } : undefined);
  }

  protected isBusy(resource: AdminResource): boolean {
    return this.busyResource() === resource;
  }

  protected formatResult(result: unknown): string {
    return JSON.stringify(result, null, 2);
  }

  private runAdminRequest(resource: AdminResource, request: Observable<unknown>, emptyResult?: unknown): void {
    this.problem.set(null);
    this.latestResult.set(null);
    this.busyResource.set(resource);

    request.pipe(finalize(() => this.busyResource.set(null))).subscribe({
      next: (result) => this.latestResult.set(result ?? emptyResult ?? { ok: true }),
      error: (error: unknown) => this.problem.set(toProblemDetail(error)),
    });
  }
}
