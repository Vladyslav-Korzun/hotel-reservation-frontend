import { Component, computed, input, output, signal } from '@angular/core';
import { Hotel } from '../../../hotels/model/hotel.model';
import { AdminStaff } from '../../model/admin.model';

export interface StaffHotelAssignment {
  staffId: number;
  hotelId: number;
}

@Component({
  selector: 'app-staff-assignment-table',
  templateUrl: './staff-assignment-table.html',
  styleUrl: './staff-assignment-table.scss',
})
export class StaffAssignmentTable {
  readonly staff = input.required<AdminStaff[]>();
  readonly hotels = input.required<Hotel[]>();
  readonly busyStaffId = input<number | null>(null);
  readonly assignmentRequested = output<StaffHotelAssignment>();
  readonly unassignmentRequested = output<number>();

  private readonly selectedHotels = signal<Record<number, number | null>>({});

  protected readonly hotelById = computed(() => new Map(this.hotels().map((hotel) => [hotel.hotelId, hotel])));

  protected hotelLabel(hotelId: number | null): string {
    if (!hotelId) return 'Unassigned';
    const hotel = this.hotelById().get(hotelId);
    return hotel ? `${hotel.name}, ${hotel.city}` : `Hotel #${hotelId}`;
  }

  protected externalIdPreview(externalId: string): string {
    return externalId.length > 32 ? `${externalId.slice(0, 16)}...${externalId.slice(-8)}` : externalId;
  }

  protected selectionFor(staff: AdminStaff): number | null {
    return this.selectedHotels()[staff.id] ?? staff.hotelId;
  }

  protected updateSelection(staffId: number, event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    const hotelId = Number(value);

    this.selectedHotels.update((selected) => ({
      ...selected,
      [staffId]: Number.isFinite(hotelId) && hotelId > 0 ? hotelId : null,
    }));
  }

  protected canAssign(staff: AdminStaff): boolean {
    const selectedHotelId = this.selectionFor(staff);
    return !!selectedHotelId && selectedHotelId !== staff.hotelId && this.busyStaffId() !== staff.id;
  }

  protected canUnassign(staff: AdminStaff): boolean {
    return !!staff.hotelId && this.busyStaffId() !== staff.id;
  }

  protected assign(staff: AdminStaff): void {
    const selectedHotelId = this.selectionFor(staff);
    if (!selectedHotelId) return;

    this.assignmentRequested.emit({
      staffId: staff.id,
      hotelId: selectedHotelId,
    });
  }

  protected unassign(staff: AdminStaff): void {
    if (!this.canUnassign(staff)) return;

    this.selectedHotels.update((selected) => ({
      ...selected,
      [staff.id]: null,
    }));
    this.unassignmentRequested.emit(staff.id);
  }
}
