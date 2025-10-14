import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { compare } from 'bcryptjs';
import { z } from 'zod';
import { randomBytes } from 'crypto';
import { UserWithBusiness, SessionData } from '../../../../types/api-routes';
import { logger } from '@/utils/production-logger';

// Forzar renderizado dinámico para esta ruta que usa headers y cookies
export const dynamic = 'force-dynamic';

const signInSchema = z.object({
  email: z.string().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Email inválido'),
  password: z.string().min(1, 'Password requerido'),
});

// Configuración de intentos de login
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutos en ms
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 días en ms

// Función para extraer businessId del request
async function getBusinessFromRequest(request: NextRequest) {
  const host = request.headers.get('host') || '';
  console.log('🔍 getBusinessFromRequest - Host:', host);

  // Para desarrollo local y dominio principal de producción
  if (host.includes('localhost') || host.includes('127.0.0.1') || host === 'lealta.app') {
    // Para desarrollo local y dominio principal, usar el primer business o crear uno de demo
    const business =
      (await prisma.business.findFirst()) ??
      (await prisma.business.create({
        data: {
          name: 'Lealta Demo',
          slug: 'demo',
          subdomain: 'demo',
          settings: {
            contactEmail: 'demo@lealta.app',
          },
        },
      }));

    console.log('🔍 getBusinessFromRequest - Business encontrado:', business?.name);
    return business;
  }

  // Para subdominio de producción, extraer del subdomain
  const subdomain = host.split('.')[0];
  console.log('🔍 getBusinessFromRequest - Buscando subdomain:', subdomain);
  const business = await prisma.business.findUnique({
    where: { subdomain },
  });

  console.log('🔍 getBusinessFromRequest - Business por subdomain:', business?.name);
  return business;
}

// Función auxiliar para buscar usuario
async function findUser(email: string, request: NextRequest) {
  const host = request.headers.get('host') || '';
  const isLocalDevelopment =
    host.includes('localhost') || 
    host.includes('127.0.0.1') ||
    host.includes('trycloudflare.com') ||
    host === 'lealta.app'; // ✅ AGREGADO: Dominio principal de producción

  if (isLocalDevelopment) {
    // En desarrollo local, buscar usuario por email sin restricción de business
    return await prisma.user.findFirst({
      where: {
        email: email,
        isActive: true,
      },
      include: {
        business: {
          select: {
            id: true,
            name: true,
            subdomain: true,
            slug: true,
            subscriptionPlan: true,
            isActive: true,
          },
        },
      },
    });
  }

  // En producción, obtener business del subdomain
  const business = await getBusinessFromRequest(request);

  if (!business) {
    throw new Error('Business no encontrado');
  }

  if (!business.isActive) {
    throw new Error('Business inactivo');
  }

  // Buscar usuario por email Y businessId
  return await prisma.user.findUnique({
    where: {
      businessId_email: {
        businessId: business.id,
        email: email,
      },
    },
    include: {
      business: {
        select: {
          id: true,
          name: true,
          subdomain: true,
          subscriptionPlan: true,
        },
      },
    },
  });
}

// Función auxiliar para validar usuario
function validateUser(user: UserWithBusiness | null, request: NextRequest): asserts user is UserWithBusiness {
  if (!user) {
    throw new Error('Credenciales inválidas');
  }

  // Verificar si el usuario está bloqueado
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const remainingTime = Math.ceil(
      (user.lockedUntil.getTime() - Date.now()) / 60000
    );
    throw new Error(
      `Cuenta bloqueada. Intenta nuevamente en ${remainingTime} minutos.`
    );
  }

  if (!user.isActive) {
    throw new Error('Usuario inactivo');
  }

  const host = request.headers.get('host') || '';
  const isLocalDevelopment =
    host.includes('localhost') || 
    host.includes('127.0.0.1') ||
    host.includes('trycloudflare.com') ||
    host === 'lealta.app'; // ✅ AGREGADO: Dominio principal de producción

  if (!isLocalDevelopment && !user.business.isActive) {
    throw new Error('Business inactivo');
  }
}

// Función auxiliar para manejar password inválido
async function handleInvalidPassword(user: UserWithBusiness) {
  const newAttempts = user.loginAttempts + 1;
  const shouldLock = newAttempts >= MAX_LOGIN_ATTEMPTS;

  await prisma.user.update({
    where: { id: user.id },
    data: {
      loginAttempts: newAttempts,
      lockedUntil: shouldLock ? new Date(Date.now() + LOCKOUT_DURATION) : null,
    },
  });

  if (shouldLock) {
    throw new Error(
      'Demasiados intentos fallidos. Cuenta bloqueada por 15 minutos.'
    );
  }

  throw new Error(
    `Credenciales inválidas. ${MAX_LOGIN_ATTEMPTS - newAttempts} intentos restantes.`
  );
}

// Función auxiliar para crear sesión de usuario
async function createUserSession(user: UserWithBusiness): Promise<SessionData> {
  // Generar token de sesión seguro
  const sessionToken = randomBytes(32).toString('hex');
  const sessionExpires = new Date(Date.now() + SESSION_DURATION);

  // Update last login y reset intentos fallidos
  await prisma.user.update({
    where: { id: user.id },
    data: {
      lastLogin: new Date(),
      loginAttempts: 0,
      lockedUntil: null,
      sessionToken,
      sessionExpires,
    },
  });

  return { sessionToken, sessionExpires };
}

// Función auxiliar para crear respuesta con cookies
function createResponse(user: UserWithBusiness, sessionToken: string) {
  const response = NextResponse.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      businessId: user.businessId,
      business: user.business,
    },
    role: user.role,
    businessSlug: user.business.subdomain,
    businessId: user.businessId,
  });

  // Set session cookie with business context
  response.cookies.set(
    'session',
    JSON.stringify({
      userId: user.id,
      role: user.role,
      email: user.email,
      businessId: user.businessId,
      businessName: user.business.name,
      sessionToken,
    }),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_DURATION / 1000, // convertir a segundos
    }
  );

  return response;
}

// Función auxiliar para manejar errores específicos
function handleAuthError(error: Error) {
  const message = error.message;

  if (message.includes('Business no encontrado')) {
    return NextResponse.json({ error: message }, { status: 404 });
  }

  if (
    message.includes('Business inactivo') ||
    message.includes('Usuario inactivo')
  ) {
    return NextResponse.json({ error: message }, { status: 403 });
  }

  if (
    message.includes('bloqueada') ||
    message.includes('Demasiados intentos')
  ) {
    return NextResponse.json({ error: message }, { status: 423 });
  }

  if (message.includes('Credenciales inválidas')) {
    return NextResponse.json({ error: message }, { status: 401 });
  }

  return NextResponse.json(
    { error: 'Error interno del servidor' },
    { status: 500 }
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = signInSchema.parse(body);

    const user = await findUser(email, request);

    // Si el usuario no existe o está inactivo, validateUser lanzará una excepción
    validateUser(user, request);

    // En este punto sabemos que user no es nulo
    // Verify password
    const isValid = await compare(password, user.passwordHash);
    if (!isValid) {
      await handleInvalidPassword(user);
      throw new Error('Credenciales inválidas');
    }

    // Crear sesión y respuesta
    const { sessionToken } = await createUserSession(user);
    return createResponse(user, sessionToken);
  } catch (error) {
    logger.error('❌ Sign in error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      return handleAuthError(error);
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
