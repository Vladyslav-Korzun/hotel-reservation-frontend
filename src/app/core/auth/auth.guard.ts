import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = async (_route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  await authService.initialize();

  if (authService.hasInitializationFailed()) {
    return router.parseUrl('/auth/unavailable');
  }

  if (authService.isAuthenticated()) {
    return true;
  }

  authService.login(state.url);
  return false;
};
