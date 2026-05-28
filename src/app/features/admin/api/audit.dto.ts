export type AuditActionType =
  | 'CREATE_RESERVATION'
  | 'CANCEL_RESERVATION'
  | 'CHECK_IN'
  | 'CHECK_OUT'
  | 'MARK_NO_SHOW'
  | 'UPDATE_ROOM_STATUS'
  | 'CREATE_HOTEL'
  | 'UPDATE_HOTEL'
  | 'CREATE_ROOM'
  | 'UPDATE_ROOM'
  | 'CREATE_ROOM_TYPE'
  | 'UPDATE_ROOM_TYPE'
  | 'CREATE_SERVICE_OFFERING'
  | 'UPDATE_SERVICE_OFFERING'
  | 'DEACTIVATE_SERVICE_OFFERING';

export type AuditEntityType =
  | 'HOTEL'
  | 'ROOM'
  | 'ROOM_TYPE'
  | 'RESERVATION'
  | 'SERVICE_OFFERING'
  | 'GUEST';

export interface AuditLogEntryDto {
  id: number;
  actorId: string;
  actorRole: string;
  actionType: AuditActionType;
  entityType: AuditEntityType;
  entityId: string;
  timestamp: string;
  details: string;
}
