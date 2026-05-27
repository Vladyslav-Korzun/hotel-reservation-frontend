// Returns a local image path. Width and quality params kept for API compatibility.
export function unsplashUrl(path: string, _width?: number, _quality?: number): string {
  return path;
}

/** One unique photo per hotel, keyed by hotelId. */
export const HOTEL_PHOTO_MAP: Record<number, string> = {
  1001: '/images/hotels/hotel-1001.jpg',
  1002: '/images/hotels/hotel-1002.jpg',
  1003: '/images/hotels/hotel-1003.jpg',
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

/** Returns a unique photo for the given hotelId, never repeating across known hotels. */
export function hotelPhotoUrl(hotelId: number): string {
  return HOTEL_PHOTO_MAP[hotelId]
    ?? FALLBACK_HOTEL_PHOTOS[Math.abs(hotelId) % FALLBACK_HOTEL_PHOTOS.length];
}

/** One unique photo per room type, keyed by roomTypeId. */
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

/** Returns a unique photo for the given roomTypeId. */
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
