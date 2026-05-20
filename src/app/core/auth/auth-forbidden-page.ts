import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-auth-forbidden-page',
  imports: [RouterLink],
  template: `
    <section class="card forbidden-page">
      <p class="eyebrow">Access</p>
      <h1>Access denied</h1>
      <p class="muted">Your current role cannot open this workflow.</p>
      <div class="d-flex flex-wrap gap-2 mt-2">
        <a class="btn forbidden-page__secondary" routerLink="/">Back to dashboard</a>
        <a class="btn forbidden-page__primary" routerLink="/reservations/find">Find reservation</a>
      </div>
    </section>
  `,
  styles: [
    `
      .forbidden-page {
        background: rgba(18, 18, 18, 0.74);
        border: 1px solid rgba(201, 190, 179, 0.18);
        border-radius: 18px;
        color: #f7f7f2;
        display: grid;
        gap: 0.85rem;
        justify-items: start;
        margin: 8rem auto 0;
        max-width: 720px;
        padding: 1.25rem;
      }

      .forbidden-page__primary,
      .forbidden-page__secondary {
        border-radius: 999px;
        font-weight: 900;
      }

      .forbidden-page__primary {
        background: #f6efe7;
        border: 1px solid #f6efe7;
        color: #252525;
      }

      .forbidden-page__secondary {
        border: 1px solid rgba(201, 190, 179, 0.3);
        color: #f1d5b2;
      }
    `,
  ],
})
export class AuthForbiddenPage {}
