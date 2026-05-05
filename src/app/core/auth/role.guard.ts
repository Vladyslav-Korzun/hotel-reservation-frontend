import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { UserRole } from './user-role';

export function roleGuard(allowedRoles: readonly UserRole[]): CanActivateFn {
  return async (_route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    await authService.initialize();

    if (authService.hasInitializationFailed()) {
      return router.parseUrl('/auth/unavailable');
    }

    if (!authService.isAuthenticated()) {
      authService.login(state.url);
      return false;
    }

    return authService.hasAnyRole(allowedRoles) ? true : router.parseUrl('/auth/forbidden');
  };
}
