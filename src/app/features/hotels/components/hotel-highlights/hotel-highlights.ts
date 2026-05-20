import { Component, computed, input } from '@angular/core';
import { Hotel } from '../../model/hotel.model';

/**
 * 2×2 grid of headline tiles. Every tile is driven by an existing Hotel field —
 * the sub-copy is generic and policy-derived, never invented data.
 */
@Component({
  selector: 'app-hotel-highlights',
  templateUrl: './hotel-highlights.html',
  styleUrl: './hotel-highlights.scss',
})
export class HotelHighlights {
  readonly hotel = input.required<Hotel>();

  protected readonly serviceTitle = computed(() => `${this.hotel().stars}-star service`);
  protected readonly serviceSub = 'Concierge, housekeeping and on-site restaurant';

  protected readonly bookableTitle = computed(() =>
    this.hotel().status === 'ACTIVE' ? 'Bookable now' : 'Currently unavailable',
  );
  protected readonly bookableSub = computed(() =>
    this.hotel().status === 'ACTIVE'
      ? 'Instant confirmation · free cancellation'
      : 'New bookings paused — check back later',
  );

  protected readonly childrenTitle = computed(() =>
    this.hotel().childrenAllowed ? 'Children welcome' : 'Adults only',
  );
  protected readonly childrenSub = computed(() => {
    const h = this.hotel();
    if (!h.childrenAllowed) return 'This hotel does not accept guests under 18';
    return `Infants up to ${h.infantMaxAge} · children up to ${h.childMaxAge}`;
  });

  protected readonly petsTitle = computed(() =>
    this.hotel().petsAllowed ? 'Pets accepted' : 'No pets',
  );
  protected readonly petsSub = computed(() =>
    this.hotel().petsAllowed
      ? 'Select room types accept pets with notice'
      : 'No room types in this hotel allow pets',
  );
}
