export const USER_ROLES = ['GUEST', 'STAFF', 'ADMIN'] as const;

export type UserRole = (typeof USER_ROLES)[number];

export function isUserRole(value: string): value is UserRole {
  return USER_ROLES.includes(value as UserRole);
}
