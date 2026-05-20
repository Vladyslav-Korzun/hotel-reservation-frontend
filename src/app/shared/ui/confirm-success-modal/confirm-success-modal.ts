import { DOCUMENT } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, input, output, signal } from '@angular/core';

@Component({
  selector: 'app-confirm-success-modal',
  templateUrl: './confirm-success-modal.html',
  styleUrl: './confirm-success-modal.scss',
})
export class ConfirmSuccessModal implements OnInit, OnDestroy {
  private readonly doc = inject(DOCUMENT);

  readonly title = input('All set! Your reservation is confirmed.');
  readonly subtitle = input('We sent confirmation to your registered email.');
  readonly entityId = input.required<string>();
  readonly idLabel = input('Reservation ID');
  readonly primaryLabel = input('View reservation');
  readonly secondaryLabel = input('Back to my reservations');
  readonly note = input('You can review or cancel from your reservations page anytime.');

  readonly primaryAction = output<void>();
  readonly secondaryAction = output<void>();

  protected readonly justCopied = signal(false);

  ngOnInit(): void {
    this.doc.body.style.overflow = 'hidden';
  }

  ngOnDestroy(): void {
    this.doc.body.style.overflow = '';
  }

  protected async copyId(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.entityId());
      this.justCopied.set(true);
      setTimeout(() => this.justCopied.set(false), 1500);
    } catch {
      // ignore — clipboard may be blocked
    }
  }

  protected onBackdropClick(event: MouseEvent): void {
    // Only close on backdrop click — but we don't auto-close; require explicit action.
    event.stopPropagation();
  }
}
