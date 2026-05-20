import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-status-badge',
  template: `<span class="badge rounded-pill status-badge" [class]="badgeClass()">{{ label() }}</span>`,
  styles: [
    `
      .status-badge {
        --status-bg: rgba(201, 190, 179, 0.16);
        --status-color: #f6efe7;
        --status-border: rgba(201, 190, 179, 0.28);
        background: var(--status-bg);
        border: 1px solid var(--status-border);
        color: var(--status-color);
        display: inline-flex;
        line-height: 1;
        font-size: 0.78rem;
        font-weight: 800;
        letter-spacing: 0.05em;
        padding: 0.42rem 0.72rem;
        text-transform: uppercase;
      }

      .status-badge.status-success {
        --status-bg: rgba(17, 104, 91, 0.22);
        --status-color: #b8f2df;
        --status-border: rgba(88, 211, 171, 0.34);
      }

      .status-badge.status-info {
        --status-bg: rgba(57, 109, 168, 0.22);
        --status-color: #cfe4ff;
        --status-border: rgba(124, 177, 237, 0.34);
      }

      .status-badge.status-warning {
        --status-bg: rgba(196, 156, 116, 0.22);
        --status-color: #f5d7ae;
        --status-border: rgba(196, 156, 116, 0.45);
      }

      .status-badge.status-danger {
        --status-bg: rgba(180, 35, 24, 0.22);
        --status-color: #ffc9c4;
        --status-border: rgba(242, 112, 101, 0.4);
      }

      .status-badge.status-muted {
        --status-bg: rgba(246, 246, 246, 0.1);
        --status-color: rgba(246, 246, 246, 0.72);
        --status-border: rgba(246, 246, 246, 0.18);
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
  PENDING: { label: 'Pending', className: 'status-warning' },
  CONFIRMED: { label: 'Confirmed', className: 'status-info' },
  CANCELLED: { label: 'Cancelled', className: 'status-danger' },
  CHECKED_IN: { label: 'Checked in', className: 'status-warning' },
  CHECKED_OUT: { label: 'Checked out', className: 'status-muted' },
  NO_SHOW: { label: 'No show', className: 'status-muted' },
  ACTIVE: { label: 'Active', className: 'status-success' },
  INACTIVE: { label: 'Inactive', className: 'status-muted' },
  UNDER_MAINTENANCE: { label: 'Maintenance', className: 'status-warning' },
  AVAILABLE: { label: 'Available', className: 'status-success' },
  OCCUPIED: { label: 'Occupied', className: 'status-info' },
  CLEANING: { label: 'Cleaning', className: 'status-warning' },
  MAINTENANCE: { label: 'Maintenance', className: 'status-warning' },
  OUT_OF_SERVICE: { label: 'Out of service', className: 'status-danger' },
};
