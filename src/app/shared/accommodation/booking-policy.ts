/**
 * Combined capacity + age policy that drives all guest-related UI.
 * Sourced from a stay's URL params (search/detail) and validated by the backend on submit.
 *
 * Flattened on purpose — these fields travel together as URL query params,
 * and a nested shape would just complicate serialization.
 */
export interface BookingPolicy {
  // ── Room capacity (from room-type) ──────────────────────────────────────
  maxAdults: number;
  maxChildren: number;
  maxInfants: number;
  /** Cap on `adults + children` (infants NOT counted). */
  maxTotalGuests: number;
  petsAllowed: boolean;
  maxPets: number;

  // ── Hotel age policy ────────────────────────────────────────────────────
  /** age ≤ infantMaxAge → infant (e.g. 0-2) */
  infantMaxAge: number;
  /** infantMaxAge < age < adultEquivalentAge → child (e.g. 3-12) */
  childMaxAge: number;
  /** adultEquivalentAge ≤ age ≤ 17 → counted as adult for capacity (e.g. 13-17).
   *  Still sent in `childrenAges` — backend reclassifies per hotel policy. */
  adultEquivalentAge: number;
  /** If false, the room must be booked with adults only (no children, no infants). */
  childrenAllowed: boolean;
}

/** Safe defaults when policy is unknown — UI falls back to generous caps. */
export const UNKNOWN_BOOKING_POLICY: BookingPolicy = {
  maxAdults: 0,
  maxChildren: 0,
  maxInfants: 0,
  maxTotalGuests: 0,
  petsAllowed: false,
  maxPets: 0,
  infantMaxAge: 2,
  childMaxAge: 12,
  adultEquivalentAge: 13,
  childrenAllowed: true,
};
