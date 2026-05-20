import { BookingPolicy } from './booking-policy';

/**
 * Age groups per hotel policy.
 *  - 'infant'                  age ≤ infantMaxAge                 (in childrenAges, takes a crib slot)
 *  - 'child'                   infantMaxAge < age < adultEquivalentAge (in childrenAges, child slot)
 *  - 'adult-equivalent-minor'  adultEquivalentAge ≤ age ≤ 17     (still in childrenAges, but eats an adult slot)
 *  - 'invalid'                 age < 0 OR age ≥ 18                (must be sent as `adults`)
 */
export type AgeGroup = 'infant' | 'child' | 'adult-equivalent-minor' | 'invalid';

export interface GuestCounts {
  adults: number;
  infantCount: number;
  childCount: number;
  /** 13-17yo — sent in childrenAges but counts as adult for occupancy. */
  adultEquivalentMinorCount: number;
  /** What the backend compares against maxAdults. */
  effectiveAdults: number;
  /** What the backend compares against maxTotalGuests (infants excluded). */
  totalForCapacity: number;
}

export type CapacityIssueCode =
  | 'CHILDREN_NOT_ALLOWED'
  | 'AGE_OUT_OF_RANGE'
  | 'TOO_MANY_ADULTS'
  | 'TOO_MANY_CHILDREN'
  | 'TOO_MANY_INFANTS'
  | 'TOO_MANY_GUESTS';

export interface CapacityIssue {
  code: CapacityIssueCode;
  message: string;
}

export type CapacityCheckResult =
  | { ok: true; counts: GuestCounts }
  | { ok: false; issue: CapacityIssue; counts: GuestCounts };

/** Classify a single age against the hotel policy. */
export function ageGroup(age: number, policy: BookingPolicy): AgeGroup {
  if (!Number.isFinite(age) || age < 0) return 'invalid';
  if (age >= 18) return 'invalid'; // must be sent as `adults`, not in childrenAges
  if (age <= policy.infantMaxAge) return 'infant';
  if (age < policy.adultEquivalentAge) return 'child';
  return 'adult-equivalent-minor';
}

/**
 * Split children ages into 3 buckets per hotel age policy.
 * Note: adult-equivalent-minors stay in `childrenAges` on the wire — the bucket
 * is purely so the UI shows the right badge and computes the right capacity.
 */
export function classifyGuests(
  adults: number,
  childrenAges: readonly number[],
  policy: BookingPolicy,
): GuestCounts {
  let infantCount = 0;
  let childCount = 0;
  let adultEquivalentMinorCount = 0;
  for (const age of childrenAges) {
    switch (ageGroup(age, policy)) {
      case 'infant':
        infantCount++;
        break;
      case 'child':
        childCount++;
        break;
      case 'adult-equivalent-minor':
        adultEquivalentMinorCount++;
        break;
      // 'invalid' is surfaced by canFitRoom, not silently dropped here.
    }
  }
  const effectiveAdults = adults + adultEquivalentMinorCount;
  return {
    adults,
    infantCount,
    childCount,
    adultEquivalentMinorCount,
    effectiveAdults,
    totalForCapacity: effectiveAdults + childCount,
  };
}

/**
 * Validate a party against a room's policy. Returns the first issue found.
 * Backend will re-validate; this is purely for UX feedback.
 */
export function canFitRoom(
  adults: number,
  childrenAges: readonly number[],
  policy: BookingPolicy,
): CapacityCheckResult {
  const counts = classifyGuests(adults, childrenAges, policy);

  if (!policy.childrenAllowed && childrenAges.length > 0) {
    return {
      ok: false,
      counts,
      issue: {
        code: 'CHILDREN_NOT_ALLOWED',
        message: 'This hotel does not allow children or infants.',
      },
    };
  }

  const invalidAge = childrenAges.find((age) => ageGroup(age, policy) === 'invalid');
  if (invalidAge !== undefined) {
    return {
      ok: false,
      counts,
      issue: {
        code: 'AGE_OUT_OF_RANGE',
        message:
          invalidAge >= 18
            ? 'Guests 18 and older must be added as adults, not children.'
            : `Age must be between 0 and 17.`,
      },
    };
  }

  if (policy.maxAdults > 0 && counts.effectiveAdults > policy.maxAdults) {
    return {
      ok: false,
      counts,
      issue: {
        code: 'TOO_MANY_ADULTS',
        message: `This room allows up to ${policy.maxAdults} ${policy.maxAdults === 1 ? 'adult' : 'adults'} (teens 13+ count as adults).`,
      },
    };
  }

  if (policy.maxInfants >= 0 && counts.infantCount > policy.maxInfants) {
    return {
      ok: false,
      counts,
      issue: {
        code: 'TOO_MANY_INFANTS',
        message: `This room allows up to ${policy.maxInfants} ${policy.maxInfants === 1 ? 'infant' : 'infants'}.`,
      },
    };
  }

  if (policy.maxChildren >= 0 && counts.childCount > policy.maxChildren) {
    return {
      ok: false,
      counts,
      issue: {
        code: 'TOO_MANY_CHILDREN',
        message: `This room allows up to ${policy.maxChildren} ${policy.maxChildren === 1 ? 'child' : 'children'}.`,
      },
    };
  }

  if (policy.maxTotalGuests > 0 && counts.totalForCapacity > policy.maxTotalGuests) {
    return {
      ok: false,
      counts,
      issue: {
        code: 'TOO_MANY_GUESTS',
        message: `This room allows up to ${policy.maxTotalGuests} guests (infants excluded).`,
      },
    };
  }

  return { ok: true, counts };
}
