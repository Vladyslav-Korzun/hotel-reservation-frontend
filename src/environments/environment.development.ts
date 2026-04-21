export const environment = {
  production: false,
  apiBaseUrl: '/api',
  auth: {
    issuer: 'http://localhost:8081/realms/hotel-reservation',
    clientId: 'hotel-reservation-frontend',
    requireHttps: false,
  },
};
