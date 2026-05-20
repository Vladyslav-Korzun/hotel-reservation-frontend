/**
 * Room amenity presentation map.
 *
 * Backend owns the stable enum codes (`RoomAmenityCode` in OpenAPI).
 * Frontend owns the human label, the grouping for UI, and the icon SVG path.
 *
 * Adding new codes from the backend is a non-breaking change — TypeScript
 * `Record<RoomAmenityCodeDto, ...>` forces us to provide a meta entry here.
 */
import type { RoomAmenityCodeDto } from '../../features/hotels/api/hotel.dto';

export type RoomAmenityGroup =
  | 'CONNECTIVITY'
  | 'CLIMATE'
  | 'BATHROOM'
  | 'COMFORT'
  | 'MEDIA'
  | 'VIEW'
  | 'ACCESSIBILITY';

export interface RoomAmenityMeta {
  label: string;
  group: RoomAmenityGroup;
  /** Inline SVG path data — rendered inside a 24x24 viewBox, stroke-only. */
  iconPath: string;
}

export const ROOM_AMENITY_GROUP_LABELS: Record<RoomAmenityGroup, string> = {
  CONNECTIVITY: 'Connectivity',
  CLIMATE: 'Climate',
  BATHROOM: 'Bathroom',
  COMFORT: 'In-room comfort',
  MEDIA: 'Media',
  VIEW: 'View',
  ACCESSIBILITY: 'Accessibility',
};

export const ROOM_AMENITY_META: Record<RoomAmenityCodeDto, RoomAmenityMeta> = {
  WIFI: {
    label: 'Wi-Fi',
    group: 'CONNECTIVITY',
    iconPath: 'M5 12a10 10 0 0 1 14 0M8.5 15.5a5 5 0 0 1 7 0M12 19h.01',
  },
  AIR_CONDITIONING: {
    label: 'Air conditioning',
    group: 'CLIMATE',
    iconPath:
      'M12 2v20M2 12h20M5 5l4 4M19 19l-4-4M19 5l-4 4M5 19l4-4',
  },
  HEATING: {
    label: 'Heating',
    group: 'CLIMATE',
    iconPath:
      'M9 21V10a3 3 0 1 1 6 0v11M7 21h10M12 6V3',
  },
  PRIVATE_BATHROOM: {
    label: 'Private bathroom',
    group: 'BATHROOM',
    iconPath:
      'M3 12h18v4a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4zM6 12V6a3 3 0 0 1 6 0M7 21l-1 2M17 21l1 2',
  },
  BATHTUB: {
    label: 'Bathtub',
    group: 'BATHROOM',
    iconPath:
      'M3 13h18v3a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4zM5 13V6a2 2 0 0 1 4 0M9 8h2',
  },
  SHOWER: {
    label: 'Shower',
    group: 'BATHROOM',
    iconPath:
      'M5 12V6a4 4 0 0 1 8 0M13 6h6v6M3 14h18M7 17v3M11 17v3M15 17v3M19 17v3',
  },
  HAIRDRYER: {
    label: 'Hairdryer',
    group: 'BATHROOM',
    iconPath:
      'M3 8h13a4 4 0 0 1 0 8H3zM7 16v4M16 12h4M16 9l4-2M16 15l4 2',
  },
  SAFE: {
    label: 'In-room safe',
    group: 'COMFORT',
    iconPath:
      'M4 4h16v16H4zM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0M15 9l1-1M15 15l1 1',
  },
  MINIBAR: {
    label: 'Minibar',
    group: 'COMFORT',
    iconPath:
      'M5 3h14v18H5zM5 11h14M9 6v2M9 14v3',
  },
  COFFEE_MACHINE: {
    label: 'Coffee machine',
    group: 'COMFORT',
    iconPath:
      'M5 8h12v6a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4zM17 10h2a2 2 0 0 1 0 4h-2M9 4c1 1 1 2 0 3M13 4c1 1 1 2 0 3',
  },
  SMART_TV: {
    label: 'Smart TV',
    group: 'MEDIA',
    iconPath: 'M3 5h18v12H3zM8 21h8M12 17v4',
  },
  SOUNDPROOFING: {
    label: 'Soundproofing',
    group: 'COMFORT',
    iconPath:
      'M4 9h4l5-4v14l-5-4H4zM16 9a4 4 0 0 1 0 6M19 6a8 8 0 0 1 0 12',
  },
  BALCONY: {
    label: 'Balcony',
    group: 'COMFORT',
    iconPath:
      'M4 3v10M20 3v10M4 13h16M7 13v8M12 13v8M17 13v8M4 21h16',
  },
  SEA_VIEW: {
    label: 'Sea view',
    group: 'VIEW',
    iconPath:
      'M3 18c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2M3 14c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2M12 4l3 4H9z',
  },
  CITY_VIEW: {
    label: 'City view',
    group: 'VIEW',
    iconPath:
      'M3 21h18M5 21V10l4-2v13M9 21V6l6 2v13M15 21V12l4 2v7M8 13h1M8 16h1M12 11h1M12 14h1M12 17h1M17 16h1',
  },
  MOUNTAIN_VIEW: {
    label: 'Mountain view',
    group: 'VIEW',
    iconPath: 'M3 20l6-10 4 6 3-4 5 8zM10 9a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0',
  },
  WORKSPACE: {
    label: 'Workspace',
    group: 'COMFORT',
    iconPath:
      'M3 13h18v2H3zM5 13V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v7M7 15v5M17 15v5',
  },
  WHEELCHAIR_ACCESSIBLE: {
    label: 'Wheelchair accessible',
    group: 'ACCESSIBILITY',
    iconPath:
      'M11 4a2 2 0 1 1-4 0 2 2 0 0 1 4 0M9 7v6h5l3 5M15 17a5 5 0 1 1-7-4',
  },
};

/** Stable order of groups when rendering categorised amenities. */
export const ROOM_AMENITY_GROUP_ORDER: readonly RoomAmenityGroup[] = [
  'CONNECTIVITY',
  'CLIMATE',
  'BATHROOM',
  'COMFORT',
  'MEDIA',
  'VIEW',
  'ACCESSIBILITY',
];

export interface RoomAmenityChip {
  code: RoomAmenityCodeDto;
  meta: RoomAmenityMeta;
}

export interface RoomAmenityGroupSection {
  group: RoomAmenityGroup;
  label: string;
  items: RoomAmenityChip[];
}

/**
 * Group a list of codes into ordered sections, dropping unknown codes
 * (defensive: backend may add codes faster than frontend pulls them).
 * Duplicates are removed.
 */
export function groupAmenities(codes: readonly string[]): RoomAmenityGroupSection[] {
  const seen = new Set<string>();
  const buckets = new Map<RoomAmenityGroup, RoomAmenityChip[]>();

  for (const raw of codes) {
    if (seen.has(raw)) continue;
    seen.add(raw);
    const meta = (ROOM_AMENITY_META as Record<string, RoomAmenityMeta | undefined>)[raw];
    if (!meta) continue; // Unknown code — silently skip, no UI noise.
    const bucket = buckets.get(meta.group) ?? [];
    bucket.push({ code: raw as RoomAmenityCodeDto, meta });
    buckets.set(meta.group, bucket);
  }

  return ROOM_AMENITY_GROUP_ORDER.flatMap<RoomAmenityGroupSection>((group) => {
    const items = buckets.get(group);
    if (!items?.length) return [];
    return [{ group, label: ROOM_AMENITY_GROUP_LABELS[group], items }];
  });
}
