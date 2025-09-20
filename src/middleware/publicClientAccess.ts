import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../lib/prisma';

// Importar funciones de cache del middleware
let getCachedBusiness: ((businessId: string) => any | null) | null = null;
let setCachedBusiness: ((businessId: string, data: any) => void) | null = null;

// Función async para inicializar funciones de cache
async function initializeCacheFunctions() {
  if (getCachedBusiness && setCachedBusiness) return; // Ya inicializadas
  
  try {
    const middlewareModule = await import('../../middleware');
    getCachedBusiness = middlewareModule.getCachedBusiness;
    setCachedBusiness = middlewareModule.setCachedBusiness;
  } catch (error) {
    console.log('Cache functions not available:', error instanceof Error ? error.message : 'Unknown error');
  }
}

/**
 * Función optimizada para buscar business por múltiples criterios con cache
 */
async function findBusinessByCriteria(businessId: string): Promise<any | null> {
  // Inicializar funciones de cache si es necesario
  await initializeCacheFunctions();
  
  // Crear una clave de cache específica para el criterio
  const cacheKey = `criteria:${businessId}`;
  
  // Intentar obtener del cache primero
  if (getCachedBusiness) {
    const cached = getCachedBusiness(cacheKey);
    if (cached) {
      console.log(`🚀 CACHE HIT: Business by criteria ${businessId} found in cache`);
      return cached;
    }
  }

  // Si no está en cache, consultar base de datos
  try {
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

    // Guardar en cache si está disponible
    if (setCachedBusiness && business) {
      setCachedBusiness(cacheKey, business);
      // También cache por ID para reutilización
      setCachedBusiness(business.id, business);
      console.log(`💾 CACHE SET: Business criteria ${businessId} cached`);
    }

    return business;
  } catch (error) {
    console.error('Error finding business by criteria:', error);
    return null;
  }
}

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
  const regex = /^\/([^/]+)\/cliente/;
  const match = regex.exec(pathname);
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
  
  // Validar que el business existe y está activo usando cache
  const business = await findBusinessByCriteria(businessId);

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
