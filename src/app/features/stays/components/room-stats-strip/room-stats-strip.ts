import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-room-stats-strip',
  templateUrl: './room-stats-strip.html',
  styleUrl: './room-stats-strip.scss',
})
export class RoomStatsStrip {
  readonly maxAdults = input.required<number>();
  readonly maxChildren = input.required<number>();
  readonly maxInfants = input.required<number>();
  readonly availableCount = input.required<number>();
  /** Human-readable bed configuration. `null`/empty → tile hidden. */
  readonly bedSetup = input<string | null>(null);
  /** Floor area in m². `null`/<=0 → tile hidden. */
  readonly roomSizeSqm = input<number | null>(null);

  protected readonly hasBedSetup = computed(() => {
    const v = this.bedSetup();
    return typeof v === 'string' && v.trim().length > 0;
  });

  protected readonly hasRoomSize = computed(() => {
    const v = this.roomSizeSqm();
    return typeof v === 'number' && Number.isFinite(v) && v > 0;
  });

  protected readonly roomSizeLabel = computed(() => {
    const v = this.roomSizeSqm();
    if (typeof v !== 'number' || !Number.isFinite(v) || v <= 0) return '';
    // Drop trailing .0 — show "28" not "28.0", but keep "28.5".
    const rounded = Math.round(v * 10) / 10;
    return `${Number.isInteger(rounded) ? rounded.toString() : rounded.toFixed(1)} m²`;
  });
}
