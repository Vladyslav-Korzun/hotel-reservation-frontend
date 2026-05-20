import { Component, computed, input } from '@angular/core';
import { Hotel } from '../../model/hotel.model';

/**
 * 2x3 grid of policy tiles, fed from the existing `Hotel` model.
 *
 * Check-in / check-out times are static (15:00 / 11:00) here.
 * // TODO(backend): expose `hotel.checkInTime` and `hotel.checkOutTime`,
 *                  matching the same convention used in room-detail.
 */
@Component({
  selector: 'app-hotel-policies',
  templateUrl: './hotel-policies.html',
  styleUrl: './hotel-policies.scss',
})
export class HotelPolicies {
  readonly hotel = input.required<Hotel>();

  protected readonly childrenText = computed(() => {
    const h = this.hotel();
    if (!h.childrenAllowed) {
      return 'Adults only. No children or infants accommodated in this hotel.';
    }
    return `Welcome. Infants 0–${h.infantMaxAge} · children up to ${h.childMaxAge} years old.`;
  });

  protected readonly petsText = computed(() =>
    this.hotel().petsAllowed
      ? 'Allowed in select room types. Confirm pet details when booking.'
      : 'No pets accepted in this hotel.',
  );
}
