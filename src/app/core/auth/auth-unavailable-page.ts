import { Component, inject } from '@angular/core';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-auth-unavailable-page',
  template: `
    <section class="page-header">
      <p class="eyebrow">Authentication</p>
      <h1>Authentication is unavailable</h1>
      <p class="muted">
        Start Keycloak and check the hotel-reservation realm before opening protected pages.
      </p>
    </section>

    <section class="card auth-unavailable-card">
      <p>Expected discovery URL:</p>
      <pre>http://localhost:8081/realms/hotel-reservation/.well-known/openid-configuration</pre>
      @if (auth.error(); as error) {
        <p>Browser error:</p>
        <pre>{{ error }}</pre>
      }
    </section>
  `,
  styles: [
    `
      .auth-unavailable-card {
        background: rgba(18, 18, 18, 0.74);
        border: 1px solid rgba(201, 190, 179, 0.18);
        border-radius: 18px;
        color: #f7f7f2;
        padding: 1.25rem;
      }

      pre {
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 8px;
        color: #f7f7f2;
        overflow-x: auto;
        padding: 1rem;
      }
    `,
  ],
})
export class AuthUnavailablePage {
  protected readonly auth = inject(AuthService);
}
