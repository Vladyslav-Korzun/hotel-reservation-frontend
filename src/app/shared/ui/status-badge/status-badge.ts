import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-status-badge',
  template: `<span class="badge" [class.cancelled]="status() === 'CANCELLED'">{{ label() }}</span>`,
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
    `,
  ],
})
export class StatusBadge {
  readonly status = input.required<string>();
  readonly label = computed(() => (this.status() === 'CANCELLED' ? 'Cancelled' : 'Pending'));
}
