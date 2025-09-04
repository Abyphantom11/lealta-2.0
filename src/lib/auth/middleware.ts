import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../prisma';

// Tipos de rol
export type UserRole = 'SUPERADMIN' | 'ADMIN' | 'STAFF';

// Definición de permisos por rol
export const ROLE_PERMISSIONS = {
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
  STAFF: ['clients.read', 'clients.create', 'consumos.create', 'consumos.read'],
};

// Rutas protegidas y sus permisos requeridos
export const PROTECTED_ROUTES = {
  '/dashboard/superadmin': {
    roles: ['SUPERADMIN'],
    permissions: ['business.manage'],
  },
  '/dashboard/admin': {
    roles: ['ADMIN'],
    permissions: ['users.read'],
  },
  '/dashboard/staff': {
    roles: ['STAFF'],
    permissions: ['consumos.create'],
  },
  '/api/users': {
    roles: ['SUPERADMIN', 'ADMIN'],
    permissions: ['users.read'],
  },
  '/api/business': {
    roles: ['SUPERADMIN'],
    permissions: ['business.manage'],
  },
};

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  businessId: string;
  permissions: readonly string[];
  sessionToken: string;
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

// Función para verificar si un rol puede crear otro rol
export function canCreateRole(
  creatorRole: UserRole,
  targetRole: UserRole
): boolean {
  const hierarchy: Record<string, string[]> = {
    SUPERADMIN: ['ADMIN', 'STAFF'],
    ADMIN: ['STAFF'],
    STAFF: [],
  };

  return hierarchy[creatorRole]?.includes(targetRole) || false;
}

// Función para verificar permisos específicos
export function hasPermission(
  userRole: UserRole,
  requiredPermission: string
): boolean {
  const rolePermissions = ROLE_PERMISSIONS[userRole];
  return rolePermissions?.includes(requiredPermission) || false;
}

// Función para verificar si puede acceder a una ruta
export function canAccessRoute(userRole: UserRole, pathname: string): boolean {
  // Buscar la ruta más específica que coincida
  const matchedRoute = Object.keys(PROTECTED_ROUTES)
    .filter(route => pathname.startsWith(route))
    .sort((a, b) => b.length - a.length)[0];

  if (!matchedRoute) return true; // Ruta no protegida

  const routeConfig =
    PROTECTED_ROUTES[matchedRoute as keyof typeof PROTECTED_ROUTES];
  return routeConfig.roles.includes(userRole);
}

// Extraer datos del usuario desde la sesión
export async function getCurrentUser(
  request: NextRequest
): Promise<AuthUser | null> {
  try {
    // Intentar obtener token desde cookie de sesión
    const sessionCookie = request.cookies.get('session')?.value;

    if (!sessionCookie) {
      return null;
    }

    // Parsear datos de la sesión
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
      permissions: [
        ...ROLE_PERMISSIONS[user.role as keyof typeof ROLE_PERMISSIONS],
      ],
      sessionToken: user.sessionToken!,
    };
  } catch (error) {
    if (error instanceof AuthError) throw error;
    console.error('Error getting current user:', error);
    return null;
  }
}

// Tipo de retorno para el middleware de autenticación
export type AuthMiddlewareResult = {
  user: AuthUser;
  response?: NextResponse;
} | {
  user: null;
  response: NextResponse;
};

// Middleware principal de autenticación
export async function authMiddleware(
  request: NextRequest,
  requiredRole?: string,
  requiredPermission?: string
): Promise<AuthMiddlewareResult> {
  try {
    const user = await getCurrentUser(request);

    if (!user) {
      throw new AuthError('No autenticado');
    }

    // Verificar rol requerido
    if (requiredRole && user.role !== requiredRole) {
      throw new AuthError('Rol insuficiente', 403);
    }

    // Verificar permiso requerido
    if (requiredPermission && !hasPermission(user.role, requiredPermission)) {
      throw new AuthError('Permisos insuficientes', 403);
    }

    // Verificar acceso a la ruta
    if (!canAccessRoute(user.role, request.nextUrl.pathname)) {
      throw new AuthError('Acceso denegado a esta ruta', 403);
    }

    return { user };
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        user: null,
        response: NextResponse.json(
          { error: error.message },
          { status: error.statusCode }
        ),
      };
    }

    return {
      user: null,
      response: NextResponse.json(
        { error: 'Error de autenticación' },
        { status: 500 }
      ),
    };
  }
}

// Helper para API routes que requieren autenticación
export function withAuth(
  handler: (request: NextRequest, user: AuthUser) => Promise<NextResponse>,
  options?: {
    role?: string;
    permission?: string;
  }
) {
  return async (request: NextRequest) => {
    const { user, response } = await authMiddleware(
      request,
      options?.role,
      options?.permission
    );

    if (response) return response;

    // Si llegamos aquí, user no debería ser null, pero agregamos verificación por seguridad
    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no autenticado' },
        { status: 401 }
      );
    }

    return handler(request, user);
  };
}

// Helper para verificar jerarquía de usuarios
export async function canManageUser(
  managerUserId: string,
  targetUserId: string
): Promise<boolean> {
  const [manager, target] = await Promise.all([
    prisma.user.findUnique({ where: { id: managerUserId } }),
    prisma.user.findUnique({ where: { id: targetUserId } }),
  ]);

  if (!manager || !target) return false;

  // Mismo business
  if (manager.businessId !== target.businessId) return false;

  // SUPERADMIN puede gestionar todos los usuarios en su business
  if (manager.role === 'SUPERADMIN') return true;

  // ADMIN solo puede gestionar STAFF que él creó
  if (
    manager.role === 'ADMIN' &&
    target.role === 'STAFF' &&
    target.createdBy === manager.id
  ) {
    return true;
  }

  return false;
}
