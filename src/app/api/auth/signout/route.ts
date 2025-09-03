import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

// Forzar renderizado dinámico para esta ruta que usa cookies
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Obtener datos de sesión
    const sessionCookie = request.cookies.get('session')?.value;

    if (sessionCookie) {
      try {
        const sessionData = JSON.parse(sessionCookie);

        if (sessionData.userId && sessionData.sessionToken) {
          // Invalidar token en base de datos
          await prisma.user.update({
            where: { id: sessionData.userId },
            data: {
              sessionToken: null,
              sessionExpires: null,
            },
          });
        }
      } catch (error) {
        console.error('Error parsing session during logout:', error);
      }
    }

    // Crear respuesta de éxito
    const response = NextResponse.json({ success: true });

    // Eliminar cookie de sesión
    response.cookies.set('session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0, // Eliminar inmediatamente
    });

    return response;
  } catch (error) {
    console.error('Logout error:', error);

    // Aún si hay error, limpiar la cookie
    const response = NextResponse.json(
      { error: 'Error cerrando sesión' },
      { status: 500 }
    );

    response.cookies.set('session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
    });

    return response;
  }
}
