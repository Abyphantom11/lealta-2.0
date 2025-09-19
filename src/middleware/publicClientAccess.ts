import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../lib/prisma';

/**
 * Middleware para permitir acceso público a /[businessId]/cliente
 * Valida que el businessId existe y está activo
 * Si no existe, muestra error amigable
 * No requiere sesión/cookie - COMPLETAMENTE PÚBLICO
 */
export async function publicClientAccess(request: NextRequest) {
  const { pathname } = request.nextUrl;
  console.log(`🔍 PUBLIC CLIENT ACCESS: Procesando ${pathname}`);
  
  // Extraer businessId de la ruta: /[businessId]/cliente
  const match = pathname.match(/^\/([^/]+)\/cliente/);
  const businessId = match ? match[1] : null;

  console.log(`📊 BusinessId extraído: ${businessId}`);

  if (!businessId) {
    console.log(`❌ No se pudo extraer businessId de ${pathname}`);
    return NextResponse.json(
      { error: 'Negocio no especificado' },
      { status: 400 }
    );
  }

  console.log(`🔍 Buscando business en DB: ${businessId}`);
  
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

  console.log(`📋 Resultado búsqueda business:`, business ? {
    id: business.id,
    name: business.name,
    slug: business.slug,
    subdomain: business.subdomain,
    isActive: business.isActive
  } : 'NO ENCONTRADO');

  if (!business) {
    console.log(`❌ Business "${businessId}" no encontrado o inactivo`);
    return NextResponse.json(
      { 
        error: 'Negocio no encontrado o inactivo',
        debug: {
          requested: businessId,
          pathname: pathname
        }
      },
      { status: 404 }
    );
  }

  console.log(`✅ Business "${businessId}" encontrado. Permitiendo acceso público a ${pathname}`);
  
  // Crear response con header de business-id para que las APIs funcionen
  const response = NextResponse.next();
  response.headers.set('x-business-id', business.id);
  
  console.log(`🏢 Business ID header set: ${business.id}`);
  return response;
}
