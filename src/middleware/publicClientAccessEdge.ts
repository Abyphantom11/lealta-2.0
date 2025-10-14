import { NextRequest, NextResponse } from 'next/server';

/**
 * Middleware optimizado para edge runtime
 * Usa API routes para validaciones de base de datos complejas
 */
export async function publicClientAccessEdge(request: NextRequest) {
  const { pathname } = request.nextUrl;
  console.log(`🔍 PUBLIC CLIENT ACCESS EDGE: Procesando ${pathname}`);
  
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

  try {
    // Usar API route interna para validar el negocio
    // Forzar HTTP en desarrollo para evitar problemas SSL
    const originalUrl = new URL(request.url);
    const protocol = process.env.NODE_ENV === 'development' ? 'http:' : originalUrl.protocol;
    const baseUrl = `${protocol}//${originalUrl.host}`;
    const validateUrl = `${baseUrl}/api/internal/validate-business?businessId=${encodeURIComponent(businessId)}`;
    
    console.log(`🔍 Validando business via API interna: ${validateUrl}`);
    
    const response = await fetch(validateUrl, {
      method: 'GET',
      headers: {
        'x-internal-request': 'true', // Header para identificar requests internos
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.log(`❌ Business "${businessId}" validation failed:`, errorData);
      
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

    const businessData = await response.json();
    console.log(`✅ Business "${businessId}" encontrado via API:`, businessData);
    
    // Crear response con header de business-id para que las APIs funcionen
    const nextResponse = NextResponse.next();
    nextResponse.headers.set('x-business-id', businessData.id);
    
    console.log(`🏢 Business ID header set: ${businessData.id}`);
    return nextResponse;
    
  } catch (error) {
    console.error('❌ Error en publicClientAccessEdge:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        debug: {
          requested: businessId,
          pathname: pathname,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      },
      { status: 500 }
    );
  }
}
