import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-auth-forbidden-page',
  imports: [RouterLink],
  template: `
    <section class="panel forbidden-page">
      <p class="eyebrow">Access</p>
      <h1>Access denied</h1>
      <p class="muted">Your current role cannot open this workflow.</p>
      <div class="actions">
        <a class="secondary-button" routerLink="/">Back to dashboard</a>
        <a class="primary-button" routerLink="/reservations/find">Find reservation</a>
      </div>
    </section>
  `,
  styles: [
    `
      .forbidden-page {
        display: grid;
        gap: 0.85rem;
        justify-items: start;
      }
    `,
  ],
})
export class AuthForbiddenPage {}
