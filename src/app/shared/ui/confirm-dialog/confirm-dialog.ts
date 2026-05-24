import { DOCUMENT } from '@angular/common';
import { Component, HostListener, Injectable, OnDestroy, OnInit, computed, inject, input, output, signal } from '@angular/core';

export interface ConfirmDialogConfig {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  busy?: () => boolean;
  onConfirm: () => void;
  onCancel?: () => void;
}

@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
  private readonly currentConfig = signal<ConfirmDialogConfig | null>(null);

  readonly config = this.currentConfig.asReadonly();
  readonly busy = computed(() => this.currentConfig()?.busy?.() ?? false);

  open(config: ConfirmDialogConfig): void {
    this.currentConfig.set(config);
  }

  cancel(): void {
    if (this.busy()) return;

    const config = this.currentConfig();
    this.currentConfig.set(null);
    config?.onCancel?.();
  }

  confirm(): void {
    if (!this.busy()) {
      this.currentConfig()?.onConfirm();
    }
  }

  close(): void {
    this.currentConfig.set(null);
  }
}

@Component({
  selector: 'app-confirm-dialog',
  template: `
    <section class="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title">
      <button
        type="button"
        class="confirm-dialog__backdrop"
        aria-label="Close dialog"
        [disabled]="busy()"
        (click)="cancelled.emit()"
      ></button>

      <div class="container confirm-dialog__content">
        <div class="dark-card confirm-dialog__panel p-4">
          <h2 id="confirm-dialog-title" class="serif-heading">{{ title() }}</h2>

          @if (message()) {
            <p>{{ message() }}</p>
          }

          <div class="confirm-dialog__actions">
            <button type="button" class="btn btn-brand-outline" [disabled]="busy()" (click)="cancelled.emit()">
              {{ cancelLabel() }}
            </button>

            <button type="button" class="btn btn-brand-danger" [disabled]="busy()" (click)="confirmed.emit()">
              {{ busy() ? 'Processing...' : confirmLabel() }}
            </button>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: `
    .confirm-dialog {
      align-items: center;
      display: flex;
      inset: 0;
      justify-content: center;
      padding: 1.25rem;
      position: fixed;
      z-index: 2100;
    }

    .confirm-dialog__backdrop {
      background: rgba(6, 7, 6, 0.78);
      border: 0;
      cursor: pointer;
      inset: 0;
      position: absolute;
    }

    .confirm-dialog__content {
      display: flex;
      justify-content: center;
      pointer-events: none;
      position: relative;
      z-index: 1;
    }

    .confirm-dialog__panel {
      max-width: 34rem;
      pointer-events: auto;
      width: 100%;
    }

    .confirm-dialog__panel h2 {
      color: var(--color-text);
      font-size: clamp(1.45rem, 3vw, 2rem);
      line-height: 1.12;
      margin-bottom: 0.8rem;
    }

    .confirm-dialog__panel p {
      color: var(--color-text-muted);
      line-height: 1.55;
      margin-bottom: 0;
    }

    .confirm-dialog__actions {
      display: flex;
      flex-direction: column-reverse;
      gap: 0.75rem;
      margin-top: 1.5rem;
    }

    @media (min-width: 576px) {
      .confirm-dialog__actions {
        flex-direction: row;
        justify-content: flex-end;
      }
    }
  `,
})
export class ConfirmDialog implements OnInit, OnDestroy {
  private readonly doc = inject(DOCUMENT);
  private previousBodyOverflow = '';

  readonly title = input.required<string>();
  readonly message = input('');
  readonly confirmLabel = input('Confirm');
  readonly cancelLabel = input('Cancel');
  readonly busy = input(false);

  readonly confirmed = output<void>();
  readonly cancelled = output<void>();

  ngOnInit(): void {
    this.previousBodyOverflow = this.doc.body.style.overflow;
    this.doc.body.style.overflow = 'hidden';
  }

  ngOnDestroy(): void {
    this.doc.body.style.overflow = this.previousBodyOverflow;
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    if (!this.busy()) {
      this.cancelled.emit();
    }
  }
}

@Component({
  selector: 'app-confirm-dialog-outlet',
  imports: [ConfirmDialog],
  template: `
    @if (confirmDialog.config(); as config) {
      <app-confirm-dialog
        [title]="config.title"
        [message]="config.message ?? ''"
        [confirmLabel]="config.confirmLabel ?? 'Confirm'"
        [cancelLabel]="config.cancelLabel ?? 'Cancel'"
        [busy]="confirmDialog.busy()"
        (confirmed)="confirmDialog.confirm()"
        (cancelled)="confirmDialog.cancel()"
      />
    }
  `,
})
export class ConfirmDialogOutlet {
  protected readonly confirmDialog = inject(ConfirmDialogService);
}
