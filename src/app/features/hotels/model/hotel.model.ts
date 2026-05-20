export type HotelStatus = 'ACTIVE' | 'INACTIVE' | 'UNDER_MAINTENANCE';

export interface Hotel {
  hotelId: number;
  name: string;
  city: string;
  country: string;
  address: string;
  stars: number;
  description: string;
  status: HotelStatus;
  childrenAllowed: boolean;
  petsAllowed: boolean;
  infantMaxAge: number;
  childMaxAge: number;
  /** Age at which a minor starts taking an adult bed-slot (e.g. 13).
   *  Still goes in `childrenAges` on the wire — backend reclassifies. */
  adultEquivalentAge: number;
}

/**
 * How the service price is applied.
 *  - PER_NIGHT: charged for each night of stay (e.g. breakfast, parking)
 *  - PER_STAY:  one-time charge regardless of nights (e.g. late check-out, airport transfer)
 */
export type ServicePricingType = 'PER_NIGHT' | 'PER_STAY';

export interface HotelServiceOffering {
  serviceOfferingId: number;
  hotelId: number;
  code: string;
  name: string;
  description: string;
  priceAmount: number;
  priceCurrency: string;
  active: boolean;
  availabilityRule: string;
  /** Optional — when omitted by the backend, inferred via `inferServicePricing` */
  pricingType?: ServicePricingType;
}

export interface HotelFilters {
  city: string;
}
