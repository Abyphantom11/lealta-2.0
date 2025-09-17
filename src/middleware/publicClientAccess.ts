import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../lib/prisma';

/**
 * Middleware para permitir acceso público a /[businessId]/cliente
 * Valida que el businessId existe y está activo
 * Si no existe, muestra error amigable
 * No requiere sesión/cookie
 */
export async function publicClientAccess(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // Extraer businessId de la ruta: /[businessId]/cliente
  const match = pathname.match(/^\/([^/]+)\/cliente/);
  const businessId = match ? match[1] : null;

  if (!businessId) {
    return NextResponse.json(
      { error: 'Negocio no especificado' },
      { status: 400 }
    );
  }

  // Validar que el business existe y está activo
  const business = await prisma.business.findFirst({
    where: {
      OR: [
        { id: businessId },
        { slug: businessId },
        { subdomain: businessId }
      ],
      isActive: true
    }
  });

  if (!business) {
    return NextResponse.json(
      { error: 'Negocio no encontrado o inactivo' },
      { status: 404 }
    );
  }

  // Permitir acceso público
  return NextResponse.next();
}
