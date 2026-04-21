import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { roleGuard } from './core/auth/role.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/pages/home-page/home-page').then((m) => m.HomePage),
  },
  {
    path: 'stays/search',
    loadComponent: () =>
      import('./features/stays/pages/stay-search-page/stay-search-page').then((m) => m.StaySearchPage),
  },
  {
    path: 'reservations/new',
    canActivate: [roleGuard(['GUEST', 'ADMIN'])],
    loadComponent: () =>
      import('./features/reservations/pages/create-reservation-page/create-reservation-page').then(
        (m) => m.CreateReservationPage,
      ),
  },
  {
    path: 'reservations/find',
    canActivate: [roleGuard(['GUEST', 'STAFF', 'ADMIN'])],
    loadComponent: () =>
      import('./features/reservations/pages/find-reservation-page/find-reservation-page').then(
        (m) => m.FindReservationPage,
      ),
  },
  {
    path: 'reservations/:reservationId',
    canActivate: [roleGuard(['GUEST', 'STAFF', 'ADMIN'])],
    loadComponent: () =>
      import('./features/reservations/pages/reservation-detail-page/reservation-detail-page').then(
        (m) => m.ReservationDetailPage,
      ),
  },
  {
    path: 'auth/unavailable',
    loadComponent: () =>
      import('./core/auth/auth-unavailable-page').then((m) => m.AuthUnavailablePage),
  },
  {
    path: 'auth/forbidden',
    canActivate: [authGuard],
    loadComponent: () => import('./core/auth/auth-forbidden-page').then((m) => m.AuthForbiddenPage),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
