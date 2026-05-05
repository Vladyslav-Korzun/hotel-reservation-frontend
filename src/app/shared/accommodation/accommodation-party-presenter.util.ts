import { AccommodationParty, BookingPet } from './accommodation-party.model';

export function formatAccommodationPartySummary(party: AccommodationParty): string {
  const parts = [
    `${party.adults} ${pluralize(party.adults, 'adult', 'adults')}`,
    `${party.childrenAges.length} ${pluralize(party.childrenAges.length, 'child', 'children')}`,
  ];

  if (party.pets.length) {
    parts.push(`${party.pets.length} ${pluralize(party.pets.length, 'pet', 'pets')}`);
  }

  return parts.join(' · ');
}

export function formatChildrenAgesSummary(childrenAges: readonly number[]): string {
  if (!childrenAges.length) {
    return 'No children';
  }

  return `Children ages: ${childrenAges.join(', ')}`;
}

export function formatPetsSummary(pets: readonly BookingPet[]): string {
  if (!pets.length) {
    return 'No pets';
  }

  return pets
    .map((pet) => `${capitalize(pet.type.toLowerCase())} ${pet.weightKg}kg`)
    .join(', ');
}

function pluralize(value: number, singular: string, plural: string): string {
  return value === 1 ? singular : plural;
}

function capitalize(value: string): string {
  return value ? value[0].toUpperCase() + value.slice(1) : value;
}
