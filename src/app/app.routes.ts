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
    canActivate: [roleGuard(['GUEST', 'STAFF', 'ADMIN'])],
    loadComponent: () =>
      import('./features/stays/pages/stay-search-page/stay-search-page').then((m) => m.StaySearchPage),
  },
  {
    path: 'hotels',
    canActivate: [roleGuard(['GUEST', 'STAFF', 'ADMIN'])],
    loadComponent: () =>
      import('./features/hotels/pages/hotel-list-page/hotel-list-page').then((m) => m.HotelListPage),
  },
  {
    path: 'hotels/:hotelId',
    canActivate: [roleGuard(['GUEST', 'STAFF', 'ADMIN'])],
    loadComponent: () =>
      import('./features/hotels/pages/hotel-detail-page/hotel-detail-page').then((m) => m.HotelDetailPage),
  },
  {
    path: 'stays/:hotelId/rooms/:roomTypeId',
    canActivate: [roleGuard(['GUEST', 'STAFF', 'ADMIN'])],
    loadComponent: () =>
      import('./features/stays/pages/stay-detail-page/stay-detail-page').then((m) => m.StayDetailPage),
  },
  {
    path: 'reservations/new',
    canActivate: [roleGuard(['GUEST'])],
    loadComponent: () =>
      import('./features/reservations/pages/create-reservation-page/create-reservation-page').then(
        (m) => m.CreateReservationPage,
      ),
  },
  {
    path: 'reservations/my',
    canActivate: [roleGuard(['GUEST', 'STAFF', 'ADMIN'])],
    loadComponent: () =>
      import('./features/reservations/pages/my-reservations-page/my-reservations-page').then(
        (m) => m.MyReservationsPage,
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
    path: 'staff',
    canActivate: [roleGuard(['STAFF', 'ADMIN'])],
    loadComponent: () =>
      import('./features/staff/pages/staff-dashboard-page/staff-dashboard-page').then((m) => m.StaffDashboardPage),
  },
  {
    path: 'admin',
    canActivate: [roleGuard(['ADMIN'])],
    loadComponent: () =>
      import('./features/admin/pages/admin-dashboard-page/admin-dashboard-page').then((m) => m.AdminDashboardPage),
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
