// Returns a local image path. Width and quality params kept for API compatibility.
export function unsplashUrl(path: string, _width?: number, _quality?: number): string {
  return path;
}

// ---------------------------------------------------------------------------
// Hotel 1004 — dedicated gallery (6 photos)
// ---------------------------------------------------------------------------
const HOTEL_1004_GALLERY: readonly string[] = [
  '/images/hotels/1004/gallery/ciudad-maderas-MXbM1NrRqtI-unsplash.jpg',
  '/images/hotels/1004/gallery/frames-for-your-heart-zSG-kd-L6vw-unsplash.jpg',
  '/images/hotels/1004/gallery/francesca-saraco-_dS27XGgRyQ-unsplash.jpg',
  '/images/hotels/1004/gallery/oswald-elsaboath-ym_EI-DTS1g-unsplash.jpg',
  '/images/hotels/1004/gallery/valeriia-bugaiova-_pPHgeHz1uk-unsplash.jpg',
  '/images/hotels/1004/gallery/vojtech-bruzek-Yrxr3bsPdS0-unsplash.jpg',
];

// ---------------------------------------------------------------------------
// Room galleries — 6 photos each
// ---------------------------------------------------------------------------
const ROOM_1401_GALLERY: readonly string[] = [
  '/images/rooms/1401/gallery/antonio-araujo-WWYF8Lts8Ho-unsplash.jpg',
  '/images/rooms/1401/gallery/adam-winger-JByeWNMdfoY-unsplash.jpg',
  '/images/rooms/1401/gallery/billy-jo-catbagan--5m_rM6fs_Q-unsplash.jpg',
  '/images/rooms/1401/gallery/oswald-elsaboath-ym_EI-DTS1g-unsplash.jpg',
  '/images/rooms/1401/gallery/patrick-konior-n4eg3hRSZIE-unsplash.jpg',
  '/images/rooms/1401/gallery/puscas-adryan-cctXsbxydg0-unsplash.jpg',
];

const ROOM_1402_GALLERY: readonly string[] = [
  '/images/rooms/1402/gallery/claudio-pecci-xqIF1YDewjk-unsplash.jpg',
  '/images/rooms/1402/gallery/collov-home-design-kSoe7EoxHIE-unsplash.jpg',
  '/images/rooms/1402/gallery/hemant-kanojiya-LSKfjiXsbUU-unsplash.jpg',
  '/images/rooms/1402/gallery/huy-nguyen-I__khoHttww-unsplash.jpg',
  '/images/rooms/1402/gallery/kin-shing-lai-o_0EQCFAkrU-unsplash.jpg',
  '/images/rooms/1402/gallery/yu-yi-tsai-UX_Pn1L2FkQ-unsplash.jpg',
];

const ROOM_1403_GALLERY: readonly string[] = [
  '/images/rooms/1403/gallery/ariel-domenden-nWYotnbVlXk-unsplash.jpg',
  '/images/rooms/1403/gallery/albeg-BiYZ45ImeCs-unsplash.jpg',
  '/images/rooms/1403/gallery/ikshana-productions-Uxr2PqYtgW4-unsplash.jpg',
  '/images/rooms/1403/gallery/khatshoot-uzojmJr2Brc-unsplash.jpg',
  '/images/rooms/1403/gallery/roberto-nickson-emqnSQwQQDo-unsplash.jpg',
  '/images/rooms/1403/gallery/zac-gudakov-UPbYh3A5cdg-unsplash.jpg',
];

/** Per-hotel gallery override. When present, used instead of ALL_HOTEL_PHOTOS pool. */
const HOTEL_GALLERY_MAP: Record<number, readonly string[]> = {
  1004: HOTEL_1004_GALLERY,
};

/** Per-room gallery override. When present, used instead of ALL_ROOM_PHOTOS pool. */
const ROOM_GALLERY_MAP: Record<number, readonly string[]> = {
  1401: ROOM_1401_GALLERY,
  1402: ROOM_1402_GALLERY,
  1403: ROOM_1403_GALLERY,
};

// ---------------------------------------------------------------------------
// Background photos (large card backgrounds)
// ---------------------------------------------------------------------------

/** Per-hotel background photo, keyed by hotelId. */
export const HOTEL_BG_MAP: Record<number, string> = {
  1004: '/images/hotels/1004/bg/valeriia-bugaiova-_pPHgeHz1uk-unsplash.jpg',
};

/** Per-room background photo, keyed by roomTypeId. */
export const ROOM_BG_MAP: Record<number, string> = {
  1401: '/images/rooms/1401/bg/antonio-araujo-WWYF8Lts8Ho-unsplash.jpg',
  1402: '/images/rooms/1402/bg/claudio-pecci-xqIF1YDewjk-unsplash.jpg',
  1403: '/images/rooms/1403/bg/ariel-domenden-nWYotnbVlXk-unsplash.jpg',
};

/** Returns the background photo for a hotel card (falls back to card photo). */
export function hotelBgUrl(hotelId: number): string {
  return HOTEL_BG_MAP[hotelId] ?? hotelPhotoUrl(hotelId);
}

/** Returns the background photo for a room card (falls back to card photo). */
export function roomBgUrl(roomTypeId: number): string {
  return ROOM_BG_MAP[roomTypeId] ?? roomPhotoUrl(roomTypeId);
}

// ---------------------------------------------------------------------------
// General pools (used as filler for hotels/rooms without dedicated galleries)
// ---------------------------------------------------------------------------

/** All available hotel photos (main pool for gallery filler). */
export const ALL_HOTEL_PHOTOS: readonly string[] = [
  '/images/hotels/hotel-1001.jpg',
  '/images/hotels/hotel-1002.jpg',
  '/images/hotels/hotel-1003.jpg',
  ...HOTEL_1004_GALLERY,
  '/images/hotels/hotel-2001.jpg',
  '/images/hotels/hotel-2002.jpg',
  '/images/hotels/hotel-3001.jpg',
  '/images/hotels/hotel-4001.jpg',
  '/images/hotels/hotel-5001.jpg',
  '/images/hotels/hotel-6001.jpg',
  '/images/hotels/hotel-1.jpg',
  '/images/hotels/hotel-2.jpg',
  '/images/hotels/hotel-3.jpg',
  '/images/hotels/hotel-4.jpg',
  '/images/hotels/hotel-5.jpg',
  '/images/hotels/hotel-6.jpg',
];

/** All available room photos (main pool for gallery filler). */
export const ALL_ROOM_PHOTOS: readonly string[] = [
  '/images/rooms/room-1101.jpg',
  '/images/rooms/room-1102.jpg',
  '/images/rooms/room-1103.jpg',
  '/images/rooms/room-1104.jpg',
  '/images/rooms/room-1201.jpg',
  '/images/rooms/room-1202.jpg',
  '/images/rooms/room-1203.jpg',
  '/images/rooms/room-1301.jpg',
  '/images/rooms/room-1302.jpg',
  '/images/rooms/room-1303.jpg',
  ...ROOM_1401_GALLERY,
  ...ROOM_1402_GALLERY,
  ...ROOM_1403_GALLERY,
  '/images/rooms/room-2101.jpg',
  '/images/rooms/room-2102.jpg',
  '/images/rooms/room-2103.jpg',
  '/images/rooms/room-2104.jpg',
  '/images/rooms/room-2201.jpg',
  '/images/rooms/room-2202.jpg',
  '/images/rooms/room-2203.jpg',
  '/images/rooms/room-3101.jpg',
  '/images/rooms/room-3102.jpg',
  '/images/rooms/room-3103.jpg',
  '/images/rooms/room-4101.jpg',
  '/images/rooms/room-4102.jpg',
  '/images/rooms/room-4103.jpg',
  '/images/rooms/room-5101.jpg',
  '/images/rooms/room-5102.jpg',
  '/images/rooms/room-5103.jpg',
  '/images/rooms/room-6101.jpg',
  '/images/rooms/room-6102.jpg',
  '/images/rooms/room-6103.jpg',
  '/images/rooms/room-1.jpg',
  '/images/rooms/room-2.jpg',
  '/images/rooms/room-3.jpg',
  '/images/rooms/room-4.jpg',
];

// ---------------------------------------------------------------------------
// Gallery helpers
// ---------------------------------------------------------------------------

/**
 * Returns `count` gallery photos for a hotel.
 * Hotels with a dedicated gallery use their own photos first.
 * Others fall back to ALL_HOTEL_PHOTOS pool.
 */
export function hotelGalleryPhotos(hotelId: number, count = 5): string[] {
  const ownGallery = HOTEL_GALLERY_MAP[hotelId];
  if (ownGallery) {
    const main = hotelPhotoUrl(hotelId);
    const rest = ownGallery.filter(p => p !== main);
    return [main, ...rest].slice(0, count);
  }
  const main = hotelPhotoUrl(hotelId);
  const pool = ALL_HOTEL_PHOTOS.filter(p => p !== main);
  const result: string[] = [main];
  for (let i = 1; i < count; i++) {
    result.push(pool[(hotelId * 7 + i * 13) % pool.length]);
  }
  return result;
}

/**
 * Returns `count` gallery photos for a room type.
 * Rooms with a dedicated gallery use their own photos first.
 * Others fall back to ALL_ROOM_PHOTOS pool.
 */
export function roomGalleryPhotos(roomTypeId: number, count = 5): string[] {
  const ownGallery = ROOM_GALLERY_MAP[roomTypeId];
  if (ownGallery) {
    const main = roomPhotoUrl(roomTypeId);
    const rest = ownGallery.filter(p => p !== main);
    return [main, ...rest].slice(0, count);
  }
  const main = roomPhotoUrl(roomTypeId);
  const pool = ALL_ROOM_PHOTOS.filter(p => p !== main);
  const result: string[] = [main];
  for (let i = 1; i < count; i++) {
    result.push(pool[(roomTypeId * 7 + i * 13) % pool.length]);
  }
  return result;
}

// ---------------------------------------------------------------------------
// Card (thumbnail) photos
// ---------------------------------------------------------------------------

/** One unique card photo per hotel, keyed by hotelId. */
export const HOTEL_PHOTO_MAP: Record<number, string> = {
  1001: '/images/hotels/hotel-1001.jpg',
  1002: '/images/hotels/hotel-1002.jpg',
  1003: '/images/hotels/hotel-1003.jpg',
  1004: '/images/hotels/1004/card/valeriia-bugaiova-_pPHgeHz1uk-unsplash.jpg',
  2001: '/images/hotels/hotel-2001.jpg',
  2002: '/images/hotels/hotel-2002.jpg',
  3001: '/images/hotels/hotel-3001.jpg',
  4001: '/images/hotels/hotel-4001.jpg',
  5001: '/images/hotels/hotel-5001.jpg',
  6001: '/images/hotels/hotel-6001.jpg',
};

const FALLBACK_HOTEL_PHOTOS = [
  '/images/hotels/hotel-1.jpg',
  '/images/hotels/hotel-2.jpg',
  '/images/hotels/hotel-3.jpg',
  '/images/hotels/hotel-4.jpg',
  '/images/hotels/hotel-5.jpg',
  '/images/hotels/hotel-6.jpg',
];

/** Returns the card photo for the given hotelId. */
export function hotelPhotoUrl(hotelId: number): string {
  return HOTEL_PHOTO_MAP[hotelId]
    ?? FALLBACK_HOTEL_PHOTOS[Math.abs(hotelId) % FALLBACK_HOTEL_PHOTOS.length];
}

/** One unique card photo per room type, keyed by roomTypeId. */
export const ROOM_PHOTO_MAP: Record<number, string> = {
  1101: '/images/rooms/room-1101.jpg',
  1102: '/images/rooms/room-1102.jpg',
  1103: '/images/rooms/room-1103.jpg',
  1104: '/images/rooms/room-1104.jpg',
  1201: '/images/rooms/room-1201.jpg',
  1202: '/images/rooms/room-1202.jpg',
  1203: '/images/rooms/room-1203.jpg',
  1301: '/images/rooms/room-1301.jpg',
  1302: '/images/rooms/room-1302.jpg',
  1303: '/images/rooms/room-1303.jpg',
  1401: '/images/rooms/1401/card/antonio-araujo-WWYF8Lts8Ho-unsplash.jpg',
  1402: '/images/rooms/1402/card/claudio-pecci-xqIF1YDewjk-unsplash.jpg',
  1403: '/images/rooms/1403/card/ariel-domenden-nWYotnbVlXk-unsplash.jpg',
  2101: '/images/rooms/room-2101.jpg',
  2102: '/images/rooms/room-2102.jpg',
  2103: '/images/rooms/room-2103.jpg',
  2104: '/images/rooms/room-2104.jpg',
  2201: '/images/rooms/room-2201.jpg',
  2202: '/images/rooms/room-2202.jpg',
  2203: '/images/rooms/room-2203.jpg',
  3101: '/images/rooms/room-3101.jpg',
  3102: '/images/rooms/room-3102.jpg',
  3103: '/images/rooms/room-3103.jpg',
  4101: '/images/rooms/room-4101.jpg',
  4102: '/images/rooms/room-4102.jpg',
  4103: '/images/rooms/room-4103.jpg',
  5101: '/images/rooms/room-5101.jpg',
  5102: '/images/rooms/room-5102.jpg',
  5103: '/images/rooms/room-5103.jpg',
  6101: '/images/rooms/room-6101.jpg',
  6102: '/images/rooms/room-6102.jpg',
  6103: '/images/rooms/room-6103.jpg',
};

const FALLBACK_ROOM_PHOTOS = [
  '/images/rooms/room-1.jpg',
  '/images/rooms/room-2.jpg',
  '/images/rooms/room-3.jpg',
  '/images/rooms/room-4.jpg',
];

/** Returns the card photo for the given roomTypeId. */
export function roomPhotoUrl(roomTypeId: number): string {
  return ROOM_PHOTO_MAP[roomTypeId]
    ?? FALLBACK_ROOM_PHOTOS[Math.abs(roomTypeId) % FALLBACK_ROOM_PHOTOS.length];
}

// Kept for backward compatibility with stay-detail-page thumbImages
export const STAY_PHOTO_IDS = [
  '/images/rooms/room-1.jpg',
  '/images/rooms/room-2.jpg',
  '/images/rooms/room-3.jpg',
  '/images/rooms/room-4.jpg',
] as const;
