import { BookingPolicy } from '../../../shared/accommodation/booking-policy';
import { AgeGroup, ageGroup } from '../../../shared/accommodation/guest-classification.util';
import { parseDisplayDate } from '../../../shared/date/display-date.util';
import { GuestDetailGroup } from './guest-detail';

export interface GuestAgeConsistencyIssue {
  message: string;
}

export function getGuestAgeConsistencyIssue(
  guest: GuestDetailGroup,
  selectedChildAge: number | null,
  policy: BookingPolicy,
): GuestAgeConsistencyIssue | null {
  const dob = guest.controls.dateOfBirth;
  if (
    dob.hasError('required') ||
    dob.hasError('invalidDate') ||
    dob.hasError('dateInFuture')
  ) {
    return null;
  }

  const dobIso = parseDisplayDate(dob.value);
  if (!dobIso) return null;

  const age = calcAgeFromDob(dobIso);
  if (guest.controls.role.value === 'ADULT') {
    return age >= 18 ? null : { message: 'Adult guests must be 18 or older.' };
  }

  if (selectedChildAge === null) return null;

  const expected = ageGroup(selectedChildAge, policy);
  const actual = ageGroup(age, policy);
  if (actual === expected) return null;

  if (actual === 'invalid') {
    return {
      message: 'Guests 18 and older must be added as adults on the trip step.',
    };
  }

  return {
    message: `Date of birth must match the ${ageGroupName(expected)} selected on the trip step (${ageGroupRange(expected, policy)}).`,
  };
}

export function calcAgeFromDob(dobIso: string): number {
  if (!dobIso) return 0;
  const dob = new Date(dobIso);
  if (Number.isNaN(dob.getTime())) return 0;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return Math.max(0, age);
}

function ageGroupName(group: AgeGroup): string {
  switch (group) {
    case 'infant':
      return 'infant';
    case 'child':
      return 'child';
    case 'adult-equivalent-minor':
      return 'teen';
    default:
      return 'child';
  }
}

function ageGroupRange(group: AgeGroup, policy: BookingPolicy): string {
  switch (group) {
    case 'infant':
      return `age 0-${policy.infantMaxAge}`;
    case 'child':
      return `age ${policy.infantMaxAge + 1}-${policy.adultEquivalentAge - 1}`;
    case 'adult-equivalent-minor':
      return `age ${policy.adultEquivalentAge}-17`;
    default:
      return 'age 0-17';
  }
}
