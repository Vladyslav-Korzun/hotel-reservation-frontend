import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-home-page',
  imports: [RouterLink],
  template: `
    <section class="hero panel">
      <p class="eyebrow">Hotel Reservation</p>
      <h1>Explore your place to stay</h1>
      <p class="muted">
        Search available stays, plan your trip and manage reservations from one place.
      </p>
      <div class="actions">
        <a class="primary-button" routerLink="/stays/search">Search stays</a>
        @if (!auth.user()) {
          <button type="button" class="secondary-button" (click)="login()">Sign in</button>
        } @else if (canCreateReservation()) {
          <a class="secondary-button" routerLink="/reservations/new">Create reservation</a>
        }
        @if (canFindReservation()) {
          <a class="secondary-button" routerLink="/reservations/find">Find reservation</a>
        }
      </div>
    </section>

    <section class="panel home-panel">
      @if (auth.user(); as user) {
        <p class="id-chip">Signed in: {{ user.username }}</p>
        <p class="muted">You can create reservations and open protected reservation pages.</p>
        <div class="actions">
          @if (canCreateReservation()) {
            <a class="primary-button" routerLink="/reservations/new">Create reservation</a>
          }
          @if (canFindReservation()) {
            <a class="secondary-button" routerLink="/reservations/find">Find reservation</a>
          }
        </div>
      } @else {
        <p class="id-chip">Guest access</p>
        <p class="muted">You can browse the start page and search stays without signing in.</p>
        <div class="actions">
          <a class="primary-button" routerLink="/stays/search">Search stays</a>
          <button type="button" class="secondary-button" (click)="login()">Sign in to reserve</button>
        </div>
      }
    </section>

    <section class="quick-grid">
      <article class="panel tile">
        <h2>Search</h2>
        <p class="muted">Pick destination, dates and guest count.</p>
      </article>
      <article class="panel tile">
        <h2>Reserve</h2>
        <p class="muted">Sign in when you are ready to create a reservation.</p>
      </article>
      <article class="panel tile">
        <h2>Manage</h2>
        <p class="muted">Review status and cancel when reservation is still pending.</p>
      </article>
    </section>
  `,
  styles: [
    `
      .hero {
        display: grid;
        gap: 0.85rem;
        margin-bottom: 1rem;
      }

      .home-panel {
        display: grid;
        gap: 0.75rem;
        justify-items: start;
        margin-bottom: 1rem;
      }

      .quick-grid {
        display: grid;
        gap: 1rem;
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }

      .tile {
        display: grid;
        gap: 0.5rem;
      }

      @media (max-width: 900px) {
        .quick-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class HomePage {
  protected readonly auth = inject(AuthService);
  protected readonly canCreateReservation = computed(() => this.auth.hasAnyRole(['GUEST', 'ADMIN']));
  protected readonly canFindReservation = computed(() => this.auth.hasAnyRole(['GUEST', 'STAFF', 'ADMIN']));

  protected login(): void {
    this.auth.login();
  }
}
