import { Component, input } from '@angular/core';

@Component({
  selector: 'app-loading-state',
  template: `
    <section class="card loading-card" aria-live="polite">
      <div class="card-body d-flex align-items-center gap-3">
        <span class="spinner-border spinner-border-sm" aria-hidden="true"></span>
        <p class="mb-0">{{ label() }}</p>
      </div>
    </section>
  `,
  styles: [
    `
      .loading-card {
        background: rgba(15, 15, 15, 0.72);
        border: 1px solid rgba(201, 190, 179, 0.18);
        border-radius: 18px;
        color: rgba(246, 246, 246, 0.82);
      }

      .loading-card p {
        font-weight: 600;
      }

      .spinner-border {
        color: #c49c74;
      }
    `,
  ],
})
export class LoadingState {
  readonly label = input('Loading...');
}
