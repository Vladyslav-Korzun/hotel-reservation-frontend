export const PET_TYPES = ['DOG', 'CAT', 'OTHER'] as const;
export const PET_SIZES = ['SMALL', 'MEDIUM', 'LARGE'] as const;

export type PetType = (typeof PET_TYPES)[number];
export type PetSize = (typeof PET_SIZES)[number];

export interface BookingPet {
  type: PetType;
  size: PetSize;
  weightKg: number;
}

export interface AccommodationParty {
  adults: number;
  childrenAges: number[];
  pets: BookingPet[];
}

export function createEmptyAccommodationParty(): AccommodationParty {
  return {
    adults: 1,
    childrenAges: [],
    pets: [],
  };
}
