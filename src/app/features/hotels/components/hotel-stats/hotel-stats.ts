import { Component, computed, input } from '@angular/core';
import { Hotel } from '../../model/hotel.model';

/**
 * 4-cell hairline-separated strip. Driven entirely from existing `Hotel` fields.
 *
 * NOTE: The mockup also shows "Established 1923" and "28 rooms". Those are NOT in
 * the backend DTO — we replaced them with Children policy and Pets policy.
 * // TODO(backend): expose `hotel.foundedYear` and per-hotel room count
 *                  to reintroduce those cells.
 */
@Component({
  selector: 'app-hotel-stats',
  templateUrl: './hotel-stats.html',
  styleUrl: './hotel-stats.scss',
})
export class HotelStats {
  readonly hotel = input.required<Hotel>();

  protected readonly starsValue = computed(() => {
    const n = this.hotel().stars;
    return `${n} ${n === 1 ? 'star' : 'stars'}`;
  });

  protected readonly childrenValue = computed(() => (this.hotel().childrenAllowed ? 'Welcome' : 'Adults only'));
  protected readonly childrenSub = computed(() =>
    this.hotel().childrenAllowed
      ? `up to ${this.hotel().childMaxAge} years`
      : 'no minors accepted',
  );

  protected readonly petsValue = computed(() => (this.hotel().petsAllowed ? 'Welcome' : 'Not allowed'));
  protected readonly petsSub = computed(() =>
    this.hotel().petsAllowed ? 'select room types' : 'no pets in this hotel',
  );

  protected readonly statusValue = computed(() => {
    switch (this.hotel().status) {
      case 'ACTIVE':
        return 'Active';
      case 'INACTIVE':
        return 'Inactive';
      case 'UNDER_MAINTENANCE':
        return 'Maintenance';
      default:
        return this.hotel().status;
    }
  });

  protected readonly statusSub = computed(() => {
    switch (this.hotel().status) {
      case 'ACTIVE':
        return 'accepting bookings';
      case 'INACTIVE':
        return 'not accepting bookings';
      case 'UNDER_MAINTENANCE':
        return 'temporarily closed';
      default:
        return '';
    }
  });

  protected readonly statusToneClass = computed(() => {
    switch (this.hotel().status) {
      case 'ACTIVE':
        return 'hotel-stat__value--success';
      case 'UNDER_MAINTENANCE':
        return 'hotel-stat__value--warning';
      default:
        return 'hotel-stat__value--muted';
    }
  });
}
