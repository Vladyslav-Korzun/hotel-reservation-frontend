/**
 * DTO shape for the availability-calendar endpoint.
 * TODO(backend): replace with `components['schemas']['RoomAvailabilityDay']` once the
 * OpenAPI types are regenerated.
 */
export interface RoomAvailabilityDayDto {
  date: string;
  availableCount: number;
  available: boolean;
}
