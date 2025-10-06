import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export type UserRole = 'SUPERADMIN' | 'ADMIN' | 'STAFF' | 'CLIENTE';

export interface Session {
  userId: string;
  email: string;
  role: UserRole;
  businessId: string;
  businessName: string;
  sessionToken: string;
}

export interface AuthContext {
  session: Session;
  user: Session; // Alias para compatibilidad
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

/**
 * Obtiene la sesión desde la cookie
 * @param request - NextRequest
 * @returns Session | null
 */
export async function getSession(request: NextRequest): Promise<Session | null> {
  try {
    const cookieValue = request.cookies.get('session')?.value;
    if (!cookieValue) {
      return null;
    }
    
    const session: Session = JSON.parse(decodeURIComponent(cookieValue));
    
    // Validar en base de datos
    const user = await prisma.user.findUnique({
      where: {
        id: session.userId,
        sessionToken: session.sessionToken,
      },
      select: {
        id: true,
        sessionExpires: true,
        role: true,
        businessId: true,
      },
    });
    
    if (!user || !user.sessionExpires || user.sessionExpires < new Date()) {
      return null;
    }
    
    return session;
  } catch (error) {
    console.error('Error parsing session:', error);
    return null;
  }
}

/**
 * Requiere autenticación y opcionalmente valida roles
 * @param request - NextRequest
 * @param options - Opciones de validación (roles)
 * @returns AuthContext
 * @throws AuthError si no está autenticado o no tiene permisos
 */
export async function requireAuth(
  request: NextRequest,
  options?: {
    roles?: UserRole[];
  }
): Promise<AuthContext> {
  const session = await getSession(request);
  
  if (!session) {
    throw new AuthError('No autenticado', 401);
  }
  
  // Validar roles si se especificaron
  if (options?.roles && !options.roles.includes(session.role)) {
    throw new AuthError('Sin permisos', 403);
  }
  
  return {
    session,
    user: session, // Alias para compatibilidad
  };
}

/**
 * Helper para obtener businessId desde múltiples fuentes
 * @param request - NextRequest
 * @param session - Session opcional
 * @returns businessId | null
 */
export function getBusinessIdFromRequest(
  request: NextRequest,
  session?: Session
): string | null {
  const url = new URL(request.url);
  
  // 1. Query parameter
  const query = url.searchParams.get('businessId');
  if (query) return query;
  
  // 2. Header
  const header = request.headers.get('x-business-id');
  if (header) return header;
  
  // 3. Referer
  const referer = request.headers.get('referer');
  if (referer) {
    try {
      const refererUrl = new URL(referer);
      const segments = refererUrl.pathname.split('/').filter(Boolean);
      if (segments.length >= 2 && segments[1] === 'admin') {
        return segments[0];
      }
    } catch {
      // Ignorar errores de parsing
    }
  }
  
  // 4. Session
  if (session?.businessId) return session.businessId;
  
  return null;
}

/**
 * Wrapper para manejar errores automáticamente en route handlers
 * @param handler - Función handler de la API
 * @param options - Opciones de autenticación
 * @returns Route handler con manejo de errores
 */
export function withAuth(
  handler: (request: NextRequest, context: AuthContext) => Promise<Response>,
  options?: { roles?: UserRole[] }
) {
  return async (request: NextRequest) => {
    try {
      const auth = await requireAuth(request, options);
      return await handler(request, auth);
    } catch (error) {
      if (error instanceof AuthError) {
        return NextResponse.json(
          { error: error.message },
          { status: error.statusCode }
        );
      }
      throw error;
    }
  };
}
