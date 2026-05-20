import { Injectable, computed, inject, signal } from '@angular/core';
import { OAuthService } from 'angular-oauth2-oidc';
import { authCodeFlowConfig } from './auth.config';
import { UserRole, isUserRole } from './user-role';

export interface AuthenticatedUser {
  username: string;
  roles: UserRole[];
  /** Standard OIDC `email` claim. Empty string when Keycloak didn't include it. */
  email: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly oauthService = inject(OAuthService);
  private readonly initialized = signal(false);
  private readonly claims = signal<Record<string, unknown> | null>(null);
  private readonly initializationFailed = signal(false);
  private readonly initializationError = signal<string | null>(null);
  private initializePromise: Promise<void> | null = null;

  readonly user = computed<AuthenticatedUser | null>(() => {
    const claims = this.claims();
    if (!claims) {
      return null;
    }

    return {
      username: this.resolveUsername(claims),
      roles: this.resolveRoles(claims),
      email: this.resolveEmail(claims),
    };
  });

  readonly isAuthenticated = computed(() => this.initialized() && this.oauthService.hasValidAccessToken());
  readonly hasInitializationFailed = this.initializationFailed.asReadonly();
  readonly error = this.initializationError.asReadonly();

  constructor() {
    this.oauthService.configure(authCodeFlowConfig);
    this.oauthService.setupAutomaticSilentRefresh();
  }

  async initialize(): Promise<void> {
    this.initializePromise ??= this.loadIdentity();
    await this.initializePromise;
  }

  login(targetUrl?: string): void {
    void this.loadDiscoveryForLogin().then(() => {
      if (!this.initializationFailed()) {
        this.oauthService.initCodeFlow(targetUrl);
      }
    });
  }

  logout(): void {
    const idToken = this.oauthService.getIdToken();
    this.claims.set(null);

    if (!idToken) {
      this.oauthService.logOut(true);
      return;
    }

    this.oauthService.logOut({
      id_token_hint: idToken,
      post_logout_redirect_uri: window.location.origin,
    });
  }

  accessToken(): string | null {
    return this.oauthService.hasValidAccessToken() ? this.oauthService.getAccessToken() : null;
  }

  hasAnyRole(roles: readonly UserRole[]): boolean {
    const user = this.user();
    return !!user && roles.some((role) => user.roles.includes(role));
  }

  private refreshClaims(): void {
    const identityClaims = (this.oauthService.getIdentityClaims() as Record<string, unknown>) ?? {};
    const accessTokenClaims = this.readAccessTokenClaims();
    this.claims.set({ ...identityClaims, ...accessTokenClaims });
  }

  private async loadIdentity(): Promise<void> {
    try {
      await this.oauthService.loadDiscoveryDocumentAndTryLogin();
      this.refreshClaims();
      this.initializationFailed.set(false);
      this.initializationError.set(null);
    } catch (error) {
      console.error('Authentication initialization failed.', error);
      this.claims.set(null);
      this.initializationFailed.set(true);
      this.initializationError.set(toErrorMessage(error));
    } finally {
      this.initialized.set(true);
    }
  }

  private async loadDiscoveryForLogin(): Promise<void> {
    try {
      await this.oauthService.loadDiscoveryDocument();
      this.initializationFailed.set(false);
      this.initializationError.set(null);
    } catch (error) {
      console.error('Authentication discovery failed.', error);
      this.initializationFailed.set(true);
      this.initializationError.set(toErrorMessage(error));
    } finally {
      this.initialized.set(true);
      this.initializePromise = null;
    }
  }

  private resolveEmail(claims: Record<string, unknown>): string {
    const email = claims['email'];
    return typeof email === 'string' ? email.trim() : '';
  }

  private resolveUsername(claims: Record<string, unknown>): string {
    const preferredUsername = claims['preferred_username'];
    const name = claims['name'];
    const subject = claims['sub'];

    if (typeof preferredUsername === 'string' && preferredUsername.trim()) {
      return preferredUsername;
    }
    if (typeof name === 'string' && name.trim()) {
      return name;
    }
    return typeof subject === 'string' ? subject : 'authenticated-user';
  }

  private resolveRoles(claims: Record<string, unknown>): UserRole[] {
    const directRoles = claims['roles'];
    if (Array.isArray(directRoles)) {
      return this.normalizeRoles(directRoles);
    }

    const realmAccess = claims['realm_access'];
    if (this.isRealmAccess(realmAccess)) {
      return this.normalizeRoles(realmAccess.roles);
    }

    return [];
  }

  private normalizeRoles(roles: unknown[]): UserRole[] {
    return roles
      .filter((role): role is string => typeof role === 'string')
      .map((role) => role.replace(/^ROLE_/i, '').toUpperCase())
      .filter(isUserRole);
  }

  private isRealmAccess(value: unknown): value is { roles: unknown[] } {
    return typeof value === 'object' && value !== null && Array.isArray((value as { roles?: unknown }).roles);
  }

  private readAccessTokenClaims(): Record<string, unknown> {
    const token = this.oauthService.getAccessToken();
    if (!token) {
      return {};
    }

    const payload = token.split('.')[1];
    if (!payload) {
      return {};
    }

    try {
      const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      const paddedBase64 = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
      const json = decodeURIComponent(
        atob(paddedBase64)
          .split('')
          .map((character) => `%${character.charCodeAt(0).toString(16).padStart(2, '0')}`)
          .join(''),
      );
      const claims = JSON.parse(json) as unknown;
      return typeof claims === 'object' && claims !== null ? (claims as Record<string, unknown>) : {};
    } catch {
      return {};
    }
  }
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return 'Unknown authentication error.';
  }
}
