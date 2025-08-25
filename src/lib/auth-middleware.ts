import { NextRequest, NextResponse } from 'next/server';
import { hasPermission, Permission } from './permissions';

interface User {
  id: string;
  role: string;
  isActive: boolean;
}

export function createAuthMiddleware(requiredPermission: Permission) {
  return async function authMiddleware(request: NextRequest) {
    try {
      // PLACEHOLDER: Get current user from session/token
      // In production, this would extract user from JWT or session
      const currentUser: User = {
        id: 'current-user-id',
        role: 'SUPERADMIN', // This will come from real session
        isActive: true
      };

      // Verificar si el usuario está activo
      if (!currentUser.isActive) {
        return NextResponse.json(
          { error: 'Usuario inactivo' },
          { status: 403 }
        );
      }

      // Verificar permisos
      if (!hasPermission(currentUser.role, requiredPermission)) {
        return NextResponse.json(
          { error: 'No tienes permisos para realizar esta acción' },
          { status: 403 }
        );
      }

      // Agregar usuario al request para uso en la API
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-user-id', currentUser.id);
      requestHeaders.set('x-user-role', currentUser.role);

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });

    } catch (error) {
      console.error('Auth middleware error:', error);
      return NextResponse.json(
        { error: 'Error de autenticación' },
        { status: 500 }
      );
    }
  };
}

export function getCurrentUser(request: NextRequest): { id: string; role: string } | null {
  const userId = request.headers.get('x-user-id');
  const userRole = request.headers.get('x-user-role');
  
  if (!userId || !userRole) {
    return null;
  }
  
  return { id: userId, role: userRole };
}
