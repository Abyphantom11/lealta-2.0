import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { compare } from 'bcryptjs';
import { z } from 'zod';

// Forzar renderizado dinámico para esta ruta que usa cookies
export const dynamic = 'force-dynamic';

const loginSchema = z.object({
  email: z
    .string()
    .email('Email inválido'),
  password: z
    .string()
    .min(1, 'Contraseña es requerida'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = loginSchema.parse(body);

    // Buscar usuario por email en todas las empresas
    const user = await prisma.user.findFirst({
      where: {
        email: validatedData.email,
        isActive: true,
      },
      include: {
        business: {
          select: {
            id: true,
            name: true,
            subdomain: true,
            isActive: true,
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      );
    }

    // Verificar que el business esté activo
    if (!user.business.isActive) {
      return NextResponse.json(
        { error: 'El negocio no está activo. Contacta al administrador.' },
        { status: 403 }
      );
    }

    // Verificar contraseña
    const isValidPassword = await compare(validatedData.password, user.passwordHash);

    if (!isValidPassword) {
      // Incrementar intentos fallidos
      await prisma.user.update({
        where: { id: user.id },
        data: {
          loginAttempts: { increment: 1 },
          // Bloquear después de 5 intentos por 15 minutos
          lockedUntil: user.loginAttempts >= 4 
            ? new Date(Date.now() + 15 * 60 * 1000)
            : undefined
        }
      });

      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      );
    }

    // Verificar si está bloqueado
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const minutesLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / (1000 * 60));
      return NextResponse.json(
        { error: `Cuenta bloqueada. Intenta en ${minutesLeft} minutos.` },
        { status: 423 }
      );
    }

    // Generar token de sesión
    const sessionToken = crypto.randomUUID();
    const sessionExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

    // Actualizar usuario con nueva sesión y resetear intentos
    await prisma.user.update({
      where: { id: user.id },
      data: {
        sessionToken,
        sessionExpires,
        lastLogin: new Date(),
        loginAttempts: 0,
        lockedUntil: null,
      }
    });

    // Crear datos de sesión
    const sessionData = {
      userId: user.id,
      businessId: user.business.id,
      userRole: user.role,
      sessionToken,
      businessSubdomain: user.business.subdomain,
    };

    // Crear respuesta con cookie de sesión
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      business: {
        id: user.business.id,
        name: user.business.name,
        subdomain: user.business.subdomain,
      },
      redirectUrl: `/${user.business.subdomain}/admin`
    });

    // Configurar cookie de sesión segura
    response.cookies.set('session', JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 horas en segundos
      path: '/',
    });

    return response;

  } catch (error) {
    console.error('Error en login:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
