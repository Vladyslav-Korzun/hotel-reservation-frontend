# Hotel Reservation Frontend

Frontend part of the Hotel Reservation project. The application is built with Angular and demonstrates a hotel reservation flow with authentication, role-based access, REST API integration and a DDD-lite project structure.

## What Is Implemented

- Public home page for both anonymous and authenticated users.
- Hotel/stay search form with:
  - destination,
  - check-in date,
  - check-out date,
  - guest count.
- Search results page with available hotel/room options.
- Reusable search form component used on the home page and on the search results page.
- Create reservation page connected to the backend REST API.
- Find reservation by ID.
- Show all reservations for `STAFF` and `ADMIN`.
- Reservation detail page.
- Cancel reservation action.
- OAuth2/OIDC login through Keycloak.
- JWT token is automatically attached to backend API requests.
- Role-based route guards.
- OpenAPI-generated DTO types for API contract synchronization.

## What Is Not Fully Implemented Yet

The stay/hotel catalog is currently a frontend mock:

```text
src/app/features/stays/services/stay-catalog.service.ts
```

Reason: the current backend implementation mainly covers the reservation vertical slice. Hotel search and room availability can later be moved from the local mock to real backend endpoints without changing the whole frontend structure, because it is already isolated inside the `stays` feature.

Reservation operations are connected to the real backend REST API.

## Tech Stack

- Angular 21
- TypeScript
- Angular Router
- Angular Reactive Forms
- RxJS
- SCSS
- `angular-oauth2-oidc`
- JWT bearer authentication
- OpenAPI-generated API types

## Project Structure

The frontend follows a feature-based DDD-lite structure:

```text
src/app/
  core/
    auth/        Authentication, JWT interceptor, route guards
    http/        API error handling
    layout/      App shell and navbar

  features/
    home/        Home page and hero components
    stays/       Stay search, results page and local stay catalog mock
    reservations/ Reservation API, facade, models, pages and components

  shared/
    date/        Shared date parsing/formatting utilities
    ui/          Reusable UI components

  styles/        Global application styles
```

Important architectural decisions:

- `core` contains application infrastructure.
- `features` contain business areas.
- `shared` contains reusable code without business ownership.
- Reservation components do not call `HttpClient` directly; they use `ReservationsFacade`.
- API calls are isolated in `ReservationsApi`.

## How To Run The Project

The frontend expects the backend and Keycloak to be running locally.

Expected local services:

```text
Frontend:  http://localhost:4200
Backend:   http://localhost:8080
Keycloak:  http://localhost:8081
```

### 1. Start Backend Infrastructure

From the backend project folder:

```powershell
cd ../Academy_Backend-main
docker compose up -d
```

This starts:

- PostgreSQL on `localhost:5432`
- Keycloak on `localhost:8081`

### 2. Start Backend Application

From the backend project folder:

```powershell
mvn -pl application/springboot -am spring-boot:run
```

Backend Swagger UI:

```text
http://localhost:8080/swagger-ui/index.html
```

### 3. Install Frontend Dependencies

From this frontend project folder:

```powershell
npm install
```

### 4. Start Frontend

```powershell
npm start
```

Open:

```text
http://localhost:4200
```

The frontend uses `proxy.conf.json`:

```text
/api -> http://localhost:8080
```

## Keycloak Setup For Testing

The frontend development environment expects:

```text
Realm:     hotel-reservation
Issuer:    http://localhost:8081/realms/hotel-reservation
Client ID: hotel-reservation-frontend
```

Recommended frontend client settings in Keycloak:

```text
Client type: OpenID Connect
Client authentication: Off
Valid redirect URIs: http://localhost:4200/*
Web origins: http://localhost:4200
Standard flow: On
```

Required realm roles:

```text
GUEST
STAFF
ADMIN
```

## Test Users

Create these users in Keycloak if they are not already present:

| Username | Password   | Role  | Purpose |
|----------|------------|-------|---------|
| `guest1` | `guest123` | GUEST | Create reservations and open own reservation details |
| `staff1` | `staff123` | STAFF | Search reservations and view all reservations |
| `admin2` | `admin123` | ADMIN | Create reservations and view all reservations |

Keycloak admin console:

```text
http://localhost:8081
```

Default Keycloak admin from `docker-compose.yml`:

| Username | Password |
|----------|----------|
| `admin`  | `admin`  |

Note: the backend setup documentation contains `guest1 / guest123` as an example user. `staff1 / staff123` and `admin2 / admin123` should be present in Keycloak for full role testing.

## Role Permissions In The Frontend

```text
GUEST
- can create a reservation
- can find/open reservation details

STAFF
- can find reservations
- can load all reservations
- cannot create a new reservation from the protected route

ADMIN
- cannot create a normal guest self-booking from the protected route
- can find reservations
- can load all reservations
```

Route protection:

```text
/reservations/new   -> GUEST
/reservations/find  -> GUEST, STAFF, ADMIN
/reservations/:id   -> GUEST, STAFF, ADMIN
```

## Main Application Flow

1. Open the home page.
2. Enter destination, dates and guest count.
3. Click search.
4. The app navigates to `/stays/search` and shows available stay options.
5. Select a room and click `Reserve`.
6. Login as `guest1`.
7. Create the reservation.
8. Open reservation details or search by reservation ID.
9. Login as `staff1` or `admin2` to load all reservations.

## REST API Integration

Reservation API calls are implemented in:

```text
src/app/features/reservations/api/reservations.api.ts
```

Used endpoints:

```text
GET  /reservations
POST /reservations
GET  /reservations/{reservationId}
POST /reservations/{reservationId}/cancel
```

JWT token attachment is implemented in:

```text
src/app/core/auth/auth-token.interceptor.ts
```

The interceptor adds:

```text
Authorization: Bearer <access_token>
```

only for API requests going to `environment.apiBaseUrl`.

## Build

```powershell
npm run build
```

Build output:

```text
dist/academy-frontend
```

## Tests

```powershell
npm test
```

## API Contract Sync

Frontend reservation DTO types are generated from the backend OpenAPI specification.

Generate types:

```powershell
npm run generate:api-types
```

Check generated types:

```powershell
npm run check:api-types
```

Source OpenAPI file:

```text
../Academy_Backend-main/application/api-spec/src/main/resources/openapi/hotel-reservation.yaml
```

## Environment Files

Development configuration:

```text
src/environments/environment.development.ts
```

Production configuration:

```text
src/environments/environment.ts
```

Development values:

```ts
apiBaseUrl: '/api'
auth.issuer: 'http://localhost:8081/realms/hotel-reservation'
auth.clientId: 'hotel-reservation-frontend'
```

## Notes For Evaluation

- The required REST API + JWT integration is implemented on the reservation screens.
- Role-based access is implemented in the frontend with route guards.
- The application is intentionally structured by features instead of putting all pages and components into one folder.
- The hotel search uses mock data because the backend reservation slice is the implemented API part.
- The mock is isolated in `StayCatalogService`, so replacing it with a real hotels API later will not require rewriting the whole app.
