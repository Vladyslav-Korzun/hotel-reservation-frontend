import { Component, input } from '@angular/core';

@Component({
  selector: 'app-loading-state',
  template: `
    <section class="panel loading">
      <span class="dot" aria-hidden="true"></span>
      <p>{{ label() }}</p>
    </section>
  `,
  styles: [
    `
      .loading {
        align-items: center;
        color: #5a6a84;
        display: flex;
        gap: 0.55rem;
      }

      .loading p {
        font-weight: 600;
      }

      .dot {
        animation: pulse 1s ease-in-out infinite;
        background: #0f766e;
        border-radius: 999px;
        display: inline-flex;
        height: 10px;
        width: 10px;
      }

      @keyframes pulse {
        0%,
        100% {
          opacity: 0.35;
          transform: scale(0.9);
        }
        50% {
          opacity: 1;
          transform: scale(1.1);
        }
      }
    `,
  ],
})
export class LoadingState {
  readonly label = input('Loading...');
}
