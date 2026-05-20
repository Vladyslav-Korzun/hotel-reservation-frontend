/** A single day's availability info for a room type. */
export interface RoomAvailabilityDay {
  /** ISO date (yyyy-MM-dd) */
  date: string;
  /** How many physical rooms of this type are free on this day */
  availableCount: number;
  /** Derived from backend; convenience for templates */
  available: boolean;
}

/** Lookup map by ISO date. */
export type AvailabilityByDate = Record<string, RoomAvailabilityDay>;

export const AVAILABILITY_MAX_RANGE_DAYS = 90;
