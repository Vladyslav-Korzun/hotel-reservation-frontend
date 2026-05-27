// Returns a local image path. Width and quality params are kept for API compatibility.
export function unsplashUrl(path: string, _width?: number, _quality?: number): string {
  return path;
}

export const HOTEL_PHOTO_IDS = [
  '/images/hotels/hotel-1.jpg',
  '/images/hotels/hotel-2.jpg',
  '/images/hotels/hotel-3.jpg',
  '/images/hotels/hotel-4.jpg',
  '/images/hotels/hotel-5.jpg',
  '/images/hotels/hotel-6.jpg',
] as const;

export const STAY_PHOTO_IDS = [
  '/images/rooms/room-1.jpg',
  '/images/rooms/room-2.jpg',
  '/images/rooms/room-3.jpg',
  '/images/rooms/room-4.jpg',
] as const;
