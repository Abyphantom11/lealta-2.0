// Sistema de validación de seguridad para middleware
import { prisma } from '../lib/prisma';

export interface AdminSession {
  userId: string;
  role: 'admin' | 'staff' | 'superadmin';
  businessId: string;
  businessSlug: string;
  permissions: string[];
  sessionType: 'admin';
}

export interface ClientSession {
  cedula: string;
  businessId: string;
  sessionType: 'client';
  // Explícitamente NO tiene permisos admin
}

export type ValidSession = AdminSession | ClientSession;

/**
 * Valida y obtiene la sesión completa del usuario
 */
export async function validateUserSession(sessionCookie: string): Promise<AdminSession | null> {
  try {
    const sessionData = JSON.parse(sessionCookie);
    
    if (!sessionData.userId) {
      return null;
    }
    
    const user = await prisma.user.findUnique({
      where: {
        id: sessionData.userId,
        isActive: true,
      },
      include: {
        business: {
          select: {
            id: true,
            slug: true,
            subdomain: true,
            isActive: true,
          },
        },
      },
    });
    
    if (!user?.business?.isActive) {
      return null;
    }

    // Mapear roles de la base de datos con permisos consistentes
    let role: 'admin' | 'staff' | 'superadmin';
    let permissions: string[] = [];

    switch (user.role) {
      case 'SUPERADMIN':
        role = 'superadmin';
        permissions = ['*']; // Todos los permisos
        break;
      case 'ADMIN':
        role = 'admin';
        permissions = [
          'users.create', 'users.read', 'users.update', 
          'clients.manage', 'consumos.manage', 'reports.view',
          'locations.read', 'read', 'write', 'admin'
        ];
        break;
      case 'STAFF':
        role = 'staff';
        permissions = [
          'clients.read', 'clients.create', 
          'consumos.create', 'consumos.read',
          'read' // Agregar permiso genérico de lectura
        ];
        break;
      default:
        return null; // Rol no válido para admin
    }

    return {
      userId: user.id,
      role,
      businessId: user.business.id,
      businessSlug: user.business.slug || user.business.subdomain,
      permissions,
      sessionType: 'admin'
    };
    
  } catch (error) {
    console.error('Error validando sesión de usuario:', error);
    return null;
  }
}

/**
 * Valida permisos específicos para una acción
 */
export function hasPermission(session: AdminSession, requiredPermission: string): boolean {
  // Superadmin tiene todos los permisos
  if (session.permissions.includes('*')) {
    return true;
  }
  
  return session.permissions.includes(requiredPermission);
}

/**
 * Valida que el usuario tenga acceso al business específico
 */
export function hasBusinessAccess(session: AdminSession, businessSlug: string): boolean {
  // Superadmin puede acceder a cualquier business
  if (session.role === 'superadmin') {
    return true;
  }
  
  // Admin y staff solo pueden acceder a su propio business
  return session.businessSlug === businessSlug;
}

/**
 * Extrae el businessId de la URL
 */
export function extractBusinessSlugFromPath(pathname: string): string | null {
  const businessMatch = pathname.match(/^\/([^\/]+)\/(admin|staff|superadmin|cliente)/);
  return businessMatch ? businessMatch[1] : null;
}

/**
 * Determina los permisos requeridos para una ruta
 */
export function getRequiredPermissions(pathname: string): string[] {
  if (pathname.includes('/superadmin')) {
    return ['*']; // Solo superadmin
  }
  
  if (pathname.includes('/admin')) {
    return ['manage_business'];
  }
  
  if (pathname.includes('/staff')) {
    return ['view_clients'];
  }
  
  if (pathname.startsWith('/api/admin/')) {
    return ['manage_business'];
  }
  
  if (pathname.startsWith('/api/clients/')) {
    return ['view_clients'];
  }
  
  return [];
}

/**
 * Valida si una ruta es de cliente (pública)
 */
export function isClientRoute(pathname: string): boolean {
  return pathname.includes('/cliente') || pathname.startsWith('/api/client/');
}

/**
 * Valida si una ruta requiere autenticación admin
 */
export function requiresAdminAuth(pathname: string): boolean {
  const adminPatterns = [
    /^\/[^\/]+\/(admin|staff|superadmin)/,
    /^\/api\/admin/,
    /^\/api\/clients/,
    /^\/api\/business/,
    /^\/api\/consumos/
  ];
  
  return adminPatterns.some(pattern => pattern.test(pathname));
}
