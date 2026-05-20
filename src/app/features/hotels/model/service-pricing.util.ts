import { HotelServiceOffering, ServicePricingType } from './hotel.model';

/**
 * Service codes known to be charged once per stay (not per night).
 * If the backend later supplies `pricingType` on the DTO, that value wins.
 */
const PER_STAY_CODES: readonly string[] = [
  'LATE_CHECKOUT',
  'LATE_CHECK_OUT',
  'EARLY_CHECKIN',
  'EARLY_CHECK_IN',
  'AIRPORT_TRANSFER',
  'AIRPORT_PICKUP',
  'AIRPORT_DROPOFF',
  'TRANSFER',
  'WELCOME_DRINK',
  'WELCOME_PACKAGE',
  'BAGGAGE_HOLD',
  'LUGGAGE_STORAGE',
  'SPA_VOUCHER',
  'ROOM_UPGRADE',
];

const PER_STAY_RULE_TOKENS: readonly string[] = ['ONE_TIME', 'PER_STAY', 'ONCE'];
const PER_NIGHT_RULE_TOKENS: readonly string[] = ['PER_NIGHT', 'DAILY', 'NIGHTLY'];

/**
 * Resolve the pricing type for a service. Priority:
 *   1. Explicit `pricingType` field from the backend
 *   2. Hint from `availabilityRule` (e.g. "ONE_TIME", "PER_NIGHT")
 *   3. Known one-time `code` value
 *   4. Default to PER_NIGHT
 */
export function inferServicePricing(service: HotelServiceOffering): ServicePricingType {
  if (service.pricingType) return service.pricingType;

  const rule = service.availabilityRule?.toUpperCase() ?? '';
  if (PER_STAY_RULE_TOKENS.some((token) => rule.includes(token))) return 'PER_STAY';
  if (PER_NIGHT_RULE_TOKENS.some((token) => rule.includes(token))) return 'PER_NIGHT';

  const code = service.code?.toUpperCase() ?? '';
  if (PER_STAY_CODES.includes(code)) return 'PER_STAY';

  return 'PER_NIGHT';
}
