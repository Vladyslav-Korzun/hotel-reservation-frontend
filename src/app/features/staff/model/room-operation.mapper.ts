import { RoomOperationResponseDto } from '../api/staff.dto';
import { RoomOperation } from './room-operation.model';

export function toRoomOperation(dto: RoomOperationResponseDto): RoomOperation {
  return {
    roomId: dto.roomId,
    hotelId: dto.hotelId,
    roomNumber: dto.roomNumber,
    roomTypeId: dto.roomTypeId,
    capacity: dto.capacity,
    status: dto.status,
  };
}
