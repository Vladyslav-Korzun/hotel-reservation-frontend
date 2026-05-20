export function unsplashUrl(photoId: string, width: number, quality = 80): string {
  return `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=${width}&q=${quality}`;
}

export const HOTEL_PHOTO_IDS = [
  'photo-1542314831-068cd1dbfeeb',
  'photo-1566073771259-6a8506099945',
  'photo-1520250497591-112f2f40a3f4',
  'photo-1445019980597-93fa8acb246c',
  'photo-1551882547-ff40c63fe5fa',
  'photo-1582719508461-905c673771fd',
] as const;

export const STAY_PHOTO_IDS = [
  'photo-1505693416388-ac5ce068fe85',
  'photo-1522798514-97ceb8c4f1c8',
  'photo-1522708323590-d24dbb6b0267',
  'photo-1505693537228-2a1f1c3b1d5c',
] as const;
