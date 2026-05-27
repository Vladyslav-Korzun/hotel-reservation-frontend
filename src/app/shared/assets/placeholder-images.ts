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

export const STAY_PHOTO_IDS = [
  '/images/rooms/room-1.jpg',
  '/images/rooms/room-2.jpg',
  '/images/rooms/room-3.jpg',
  '/images/rooms/room-4.jpg',
] as const;
