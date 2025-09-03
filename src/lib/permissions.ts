// Sistema de permisos granulares
export type Permission =
  | 'users.create'
  | 'users.read'
  | 'users.update'
  | 'users.delete'
  | 'clients.read'
  | 'clients.manage'
  | 'consumos.create'
  | 'consumos.read'
  | 'analytics.view'
  | 'analytics.full'
  | 'loyalty.manage'
  | 'menu.manage';

export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  SUPERADMIN: [
    'users.create',
    'users.read',
    'users.update',
    'users.delete',
    'clients.read',
    'clients.manage',
    'consumos.create',
    'consumos.read',
    'analytics.view',
    'analytics.full',
    'loyalty.manage',
    'menu.manage',
  ],
  ADMIN: [
    'clients.read',
    'clients.manage',
    'consumos.read',
    'analytics.view',
    'loyalty.manage',
    'menu.manage',
  ],
  STAFF: ['clients.read', 'consumos.create', 'consumos.read'],
};

export function hasPermission(
  userRole: string,
  permission: Permission
): boolean {
  return ROLE_PERMISSIONS[userRole]?.includes(permission) || false;
}

export function getUserPermissions(role: string): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}

export function canUserManageRole(userRole: string): boolean {
  if (userRole === 'SUPERADMIN') {
    return true; // SuperAdmin puede gestionar cualquier rol
  }
  return false; // Admin y Staff no pueden crear usuarios
}
