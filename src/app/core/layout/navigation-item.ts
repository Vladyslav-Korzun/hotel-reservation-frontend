import { UserRole } from '../auth/user-role';

export interface NavigationItem {
  label: string;
  path: string;
  exact?: boolean;
  roles?: readonly UserRole[];
}

export const NAVIGATION_ITEMS: readonly NavigationItem[] = [
  {
    label: 'Home',
    path: '/',
    exact: true,
  },
  {
    label: 'Trips',
    path: '/stays/search',
  },
  {
    label: 'Reservation',
    path: '/reservations/new',
    roles: ['GUEST', 'ADMIN'],
  },
];
