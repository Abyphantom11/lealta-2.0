// src/lib/auth/unified-middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../prisma';

export type UserRole = 'SUPERADMIN' | 'ADMIN' | 'STAFF' | 'CLIENTE';

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  businessId: string;
  sessionToken: string;
  business: {
    id: string;
    name: string;
    slug: string | null;
    subdomain: string;
    isActive: boolean;
  };
}

export class AuthError extends Error {
  constructor(
    message: string,
    public statusCode: number = 401
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

// Definición de permisos por rol
const ROLE_PERMISSIONS = {
  SUPERADMIN: [
    'business.manage',
    'users.create',
    'users.read', 
    'users.update',
    'users.delete',
    'locations.manage',
    'clients.manage',
    'consumos.manage',
    'reports.view',
    'settings.manage',
    'billing.manage',
  ],
  ADMIN: [
    'users.create', // Solo puede crear STAFF
    'users.read',
    'users.update', // Solo STAFF que él creó
    'clients.manage',
    'consumos.manage', 
    'reports.view',
    'locations.read',
  ],
  STAFF: [
    'clients.read',
    'clients.create', 
    'consumos.create',
    'consumos.read'
  ],
  CLIENTE: [
    'profile.read',
    'profile.update',
    'points.view',
    'history.view'
  ],
};

// Jerarquía de roles para creación
const ROLE_HIERARCHY: Record<UserRole, UserRole[]> = {
  SUPERADMIN: ['ADMIN', 'STAFF'],
  ADMIN: ['STAFF'],
  STAFF: [],
  CLIENTE: [],
};

/**
 * Obtiene el usuario actual desde la sesión
 */
export async function getCurrentUser(request: NextRequest): Promise<AuthUser | null> {
  try {
    const sessionCookie = request.cookies.get('session')?.value;
    
    if (!sessionCookie) {
      return null;
    }

    const sessionData = JSON.parse(sessionCookie);
    
    if (!sessionData.userId || !sessionData.sessionToken) {
      return null;
    }

    // Verificar usuario en base de datos
    const user = await prisma.user.findUnique({
      where: {
        id: sessionData.userId,
        sessionToken: sessionData.sessionToken,
        isActive: true,
      },
      include: {
        business: {
          select: {
            id: true,
            name: true,
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

    // Verificar expiración de sesión
    if (user.sessionExpires && user.sessionExpires < new Date()) {
      return null;
    }

    // Verificar si el usuario está bloqueado
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new AuthError('Cuenta temporalmente bloqueada', 423);
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as UserRole,
      businessId: user.businessId,
      sessionToken: user.sessionToken!,
      business: {
        id: user.business.id,
        name: user.business.name,
        slug: user.business.slug,
        subdomain: user.business.subdomain,
        isActive: user.business.isActive,
      }
    };
    
  } catch (error) {
    if (error instanceof AuthError) throw error;
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Verifica si un usuario tiene un permiso específico
 */
export function hasPermission(userRole: UserRole, permission: string): boolean {
  const rolePermissions = ROLE_PERMISSIONS[userRole];
  return rolePermissions?.includes(permission) || false;
}

/**
 * Verifica si un rol puede crear otro rol
 */
export function canCreateRole(creatorRole: UserRole, targetRole: UserRole): boolean {
  const allowedRoles = ROLE_HIERARCHY[creatorRole];
  return allowedRoles?.includes(targetRole) || false;
}

/**
 * Middleware de autenticación unificado para APIs
 */
export async function requireAuth(
  request: NextRequest,
  options?: {
    role?: UserRole;
    permission?: string;
    allowSuperAdmin?: boolean; // SUPERADMIN siempre puede acceder
  }
): Promise<{ user: AuthUser; error?: never } | { user?: never; error: NextResponse }> {
  try {
    const user = await getCurrentUser(request);

    if (!user) {
      return {
        error: NextResponse.json(
          { error: 'No autenticado' },
          { status: 401 }
        )
      };
    }

    // Verificar rol requerido
    if (options?.role) {
      const allowSuperAdmin = options.allowSuperAdmin !== false; // Por defecto true
      
      if (user.role !== options.role) {
        // SUPERADMIN puede acceder a cualquier ruta a menos que se indique lo contrario
        if (!(allowSuperAdmin && user.role === 'SUPERADMIN')) {
          return {
            error: NextResponse.json(
              { error: 'Rol insuficiente' },
              { status: 403 }
            )
          };
        }
      }
    }

    // Verificar permiso requerido
    if (options?.permission && !hasPermission(user.role, options.permission)) {
      return {
        error: NextResponse.json(
          { error: 'Permisos insuficientes' },
          { status: 403 }
        )
      };
    }

    return { user };

  } catch (error) {
    if (error instanceof AuthError) {
      return {
        error: NextResponse.json(
          { error: error.message },
          { status: error.statusCode }
        )
      };
    }

    console.error('Auth middleware error:', error);
    return {
      error: NextResponse.json(
        { error: 'Error de autenticación' },
        { status: 500 }
      )
    };
  }
}

/**
 * HOC para wrappear handlers de API con autenticación
 */
export function withAuth<T extends any[]>(
  handler: (request: NextRequest, user: AuthUser, ...args: T) => Promise<NextResponse>,
  options?: {
    role?: UserRole;
    permission?: string;
    allowSuperAdmin?: boolean;
  }
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    const auth = await requireAuth(request, options);
    
    if (auth.error) {
      return auth.error;
    }

    return handler(request, auth.user, ...args);
  };
}

/**
 * Obtiene contexto de business desde headers (para middleware de routing)
 */
export function getBusinessContext(request: NextRequest) {
  return {
    businessId: request.headers.get('x-business-id'),
    subdomain: request.headers.get('x-business-subdomain'),
    businessName: request.headers.get('x-business-name'),
    userId: request.headers.get('x-user-id'),
    userRole: request.headers.get('x-user-role'),
  };
}

/**
 * Agrega headers de contexto de usuario a la respuesta
 */
export function addUserContext(request: NextRequest, user: AuthUser): Headers {
  const headers = new Headers(request.headers);
  headers.set('x-user-id', user.id);
  headers.set('x-user-role', user.role);
  headers.set('x-business-id', user.businessId);
  headers.set('x-business-subdomain', user.business.subdomain);
  headers.set('x-business-name', user.business.name);
  return headers;
}
