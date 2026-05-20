export type RoomOperationalStatus = 'AVAILABLE' | 'CLEANING' | 'MAINTENANCE' | 'OUT_OF_SERVICE';
export type RoomStatus = RoomOperationalStatus | 'OCCUPIED';

export interface RoomOperation {
  roomId: number;
  hotelId: number;
  roomNumber: string;
  roomTypeId: number;
  capacity: number;
  status: RoomStatus;
}
