export const ACCOMMODATION_LIMITS = {
  MAX_ADULTS: 12,
  MAX_CHILDREN: 8,
  MAX_CHILD_AGE: 17,
  /** Realistic per-booking ceiling; most hotels allow 1-2. Backend `maxPets`
   *  per room-type is always the source of truth — this is just a UI cap. */
  MAX_PETS: 3,
} as const;
