import { AuthConfig } from 'angular-oauth2-oidc';
import { environment } from '../../../environments/environment';

export const authCodeFlowConfig: AuthConfig = {
  issuer: environment.auth.issuer,
  clientId: environment.auth.clientId,
  redirectUri: window.location.origin,
  postLogoutRedirectUri: window.location.origin,
  responseType: 'code',
  scope: 'openid profile email',
  requireHttps: environment.auth.requireHttps,
  showDebugInformation: !environment.production,
  // No `useSilentRefresh: true` on purpose.
  // With responseType === 'code', angular-oauth2-oidc routes automatic renewal
  // through the refresh_token grant (no iframe, no silent-refresh.html required).
  // Keycloak returns a refresh_token by default for the authorization_code flow,
  // and setupAutomaticSilentRefresh() in AuthService schedules the call.
};
