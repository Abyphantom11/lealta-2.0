import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

// Forzar renderizado dinámico para esta ruta que usa cookies
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Obtener datos de sesión
    const sessionCookie = request.cookies.get('session')?.value;

    if (!sessionCookie) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Parsear datos de la sesión
    const sessionData = JSON.parse(sessionCookie);

    if (!sessionData.userId || !sessionData.sessionToken) {
      return NextResponse.json({ error: 'Sesión inválida' }, { status: 401 });
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
            subdomain: true,
            subscriptionPlan: true,
            isActive: true,
          },
        },
      },
    });

    if (!user?.business?.isActive) {
      return NextResponse.json(
        { error: 'Usuario no encontrado o inactivo' },
        { status: 401 }
      );
    }

    // Verificar expiración de sesión
    if (user.sessionExpires && user.sessionExpires < new Date()) {
      return NextResponse.json({ error: 'Sesión expirada' }, { status: 401 });
    }

    // Verificar si el usuario está bloqueado
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      return NextResponse.json(
        { error: 'Cuenta temporalmente bloqueada' },
        { status: 423 }
      );
    }

    // Retornar datos del usuario
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        businessId: user.businessId,
        business: user.business,
      },
    });
  } catch (error) {
    console.error('Error getting user data:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
