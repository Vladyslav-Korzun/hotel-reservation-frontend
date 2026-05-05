import { ParamMap } from '@angular/router';
import { AccommodationParty, BookingPet, PetSize, PetType } from './accommodation-party.model';

export function accommodationPartyToQueryParams(
  party: AccommodationParty,
): Record<string, string | number | null> {
  return {
    adults: party.adults,
    childrenAges: serializeChildrenAges(party.childrenAges),
    pets: serializePets(party.pets),
  };
}

export function readAccommodationPartyFromQuery(params: ParamMap, fallbackAdults = 1): AccommodationParty {
  const adults = normalizePositiveNumber(params.get('adults'), fallbackAdults);
  return {
    adults,
    childrenAges: parseChildrenAges(params.get('childrenAges')),
    pets: parsePets(params.get('pets')),
  };
}

export function serializeChildrenAges(childrenAges: readonly number[]): string | null {
  if (!childrenAges.length) {
    return null;
  }

  return childrenAges.join(',');
}

export function parseChildrenAges(value: string | null): number[] {
  if (!value?.trim()) {
    return [];
  }

  return value
    .split(',')
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isFinite(item) && item >= 0);
}

export function serializePets(pets: readonly BookingPet[]): string | null {
  if (!pets.length) {
    return null;
  }

  return JSON.stringify(pets);
}

export function parsePets(value: string | null): BookingPet[] {
  if (!value?.trim()) {
    return [];
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((item) => toBookingPet(item))
      .filter((item): item is BookingPet => item !== null);
  } catch {
    return [];
  }
}

function normalizePositiveNumber(value: string | null, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function toBookingPet(value: unknown): BookingPet | null {
  if (typeof value !== 'object' || value === null) {
    return null;
  }

  const candidate = value as { type?: unknown; size?: unknown; weightKg?: unknown };
  const weightKg = Number(candidate.weightKg);

  if (!isPetType(candidate.type) || !isPetSize(candidate.size) || !Number.isFinite(weightKg) || weightKg < 0) {
    return null;
  }

  return {
    type: candidate.type,
    size: candidate.size,
    weightKg,
  };
}

function isPetType(value: unknown): value is PetType {
  return value === 'DOG' || value === 'CAT' || value === 'OTHER';
}

function isPetSize(value: unknown): value is PetSize {
  return value === 'SMALL' || value === 'MEDIUM' || value === 'LARGE';
}
