# Hotel Reservation Frontend

Angular frontend for a hotel reservation system. The application provides a public home page with hotel search, a stay results page, and authenticated reservation workflows connected to the backend REST API with JWT authentication.

## Features

- Public home page for registered and non-registered users
- Hotel search form with destination, check-in date, check-out date and guest count
- Search results page with reusable search form and available stay cards
- Create reservation flow for `GUEST` and `ADMIN`
- Find reservation by ID for authenticated users
- View all reservations for `STAFF` and `ADMIN`
- Reservation detail page with cancellation support
- OAuth2/OIDC login flow with JWT bearer tokens
- REST API integration for reservation operations
- OpenAPI-generated DTO types for backend contract sync

## Tech Stack

- Angular 21
- TypeScript
- Angular Router
- Angular Reactive Forms
- RxJS
- angular-oauth2-oidc
- SCSS
- Vitest via Angular test builder

## Project Structure

The project follows a feature-based, DDD-lite structure:

```text
src/app/
  core/
    auth/        Authentication, JWT, guards
    http/        API error handling
    layout/      App shell and navbar

  features/
    home/        Home page and hero components
    stays/       Stay search form, search results, local stay catalog mock
    reservations/ Reservation API, facade, model, pages and components

  shared/
    date/        Shared date parsing and formatting utilities
    ui/          Reusable UI components

  styles/        Global application styles
```

`stays` currently uses local mock data. Reservation screens are connected to the backend REST API.

## Main Routes

```text
/                     Home page
/stays/search         Stay search results
/reservations/new     Create reservation, roles: GUEST, ADMIN
/reservations/find    Find/list reservations, roles: GUEST, STAFF, ADMIN
/reservations/:id     Reservation details, roles: GUEST, STAFF, ADMIN
/auth/unavailable     Authentication error page
/auth/forbidden       Access denied page
```

## REST API And JWT

Reservation API calls are implemented in:

```text
src/app/features/reservations/api/reservations.api.ts
```

The API layer supports:

- `GET /reservations`
- `POST /reservations`
- `GET /reservations/{reservationId}`
- `POST /reservations/{reservationId}/cancel`

JWT tokens are attached by:

```text
src/app/core/auth/auth-token.interceptor.ts
```

The interceptor adds `Authorization: Bearer <token>` only for requests going to `environment.apiBaseUrl`.

## Environment

Development environment:

```text
src/environments/environment.development.ts
```

Default development values:

```ts
apiBaseUrl: '/api'
auth.issuer: 'http://localhost:8081/realms/hotel-reservation'
auth.clientId: 'hotel-reservation-frontend'
```

The Angular dev server uses `proxy.conf.json`:

```text
/api -> http://localhost:8080
```

Expected local services:

- Backend API: `http://localhost:8080`
- Auth server / Keycloak realm: `http://localhost:8081/realms/hotel-reservation`
- Frontend: `http://localhost:4200`

## Installation

```bash
npm install
```

## Development Server

```bash
npm start
```

Open:

```text
http://localhost:4200
```

## Build

```bash
npm run build
```

Build output:

```text
dist/academy-frontend
```

## Tests

```bash
npm test
```

## API Contract Sync

Frontend reservation DTO types are generated from the backend OpenAPI specification.

Generate types:

```bash
npm run generate:api-types
```

Check generated types:

```bash
npm run check:api-types
```

Source OpenAPI file:

```text
../Academy_Backend-main/application/api-spec/src/main/resources/openapi/hotel-reservation.yaml
```

## Roles

```text
GUEST  - create reservations, find own reservations, open reservation detail
STAFF  - find reservations and view all reservations
ADMIN  - create reservations, find reservations and view all reservations
```

Route access is enforced by:

```text
src/app/core/auth/role.guard.ts
```

## Notes

- The stay catalog is currently a local mock in `StayCatalogService`.
- Reservation workflows are connected to the REST API.
- The project uses lazy loaded standalone Angular components.
- Shared logic such as date parsing lives in `shared`, not inside page components.
