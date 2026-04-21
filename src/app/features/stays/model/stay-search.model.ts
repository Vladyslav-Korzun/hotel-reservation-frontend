export interface StaySearchCriteria {
  destination: string;
  checkIn: string;
  checkOut: string;
  guests: number;
}

export interface StayOption {
  hotelId: number;
  roomTypeId: number;
  hotelName: string;
  roomName: string;
  location: string;
  capacity: number;
  nightlyPrice: number;
  rating: number;
  tags: readonly string[];
  description: string;
}

