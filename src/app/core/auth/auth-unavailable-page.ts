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

    <section class="panel">
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
      pre {
        background: #f6f8fa;
        border: 1px solid #d6dde5;
        border-radius: 8px;
        overflow-x: auto;
        padding: 1rem;
      }
    `,
  ],
})
export class AuthUnavailablePage {
  protected readonly auth = inject(AuthService);
}
