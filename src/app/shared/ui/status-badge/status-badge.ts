import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-status-badge',
  template: `<span class="badge" [class]="badgeClass()">{{ label() }}</span>`,
  styles: [
    `
      .badge {
        background: #d9f2ee;
        border-radius: 999px;
        color: #0b5f58;
        display: inline-flex;
        font-size: 0.78rem;
        font-weight: 800;
        letter-spacing: 0.05em;
        padding: 0.35rem 0.7rem;
        text-transform: uppercase;
      }

      .badge.cancelled {
        background: #ffe4e2;
        color: #7a1f16;
      }

      .badge.confirmed {
        background: #e3efff;
        color: #123f74;
      }

      .badge.checked-in {
        background: #fff3d6;
        color: #8a5400;
      }

      .badge.checked-out {
        background: #ece9ff;
        color: #44308f;
      }
    `,
  ],
})
export class StatusBadge {
  readonly status = input.required<string>();
  readonly label = computed(() => STATUS_META[this.status()]?.label ?? this.status());
  readonly badgeClass = computed(() => STATUS_META[this.status()]?.className ?? '');
}

const STATUS_META: Record<string, { label: string; className: string }> = {
  PENDING: { label: 'Pending', className: '' },
  CONFIRMED: { label: 'Confirmed', className: 'confirmed' },
  CANCELLED: { label: 'Cancelled', className: 'cancelled' },
  CHECKED_IN: { label: 'Checked in', className: 'checked-in' },
  CHECKED_OUT: { label: 'Checked out', className: 'checked-out' },
};
