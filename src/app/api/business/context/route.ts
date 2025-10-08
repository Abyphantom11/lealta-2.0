import { NextRequest, NextResponse } from 'next/server';

/**
 * 🎯 API ENDPOINT: GET BUSINESS CONTEXT
 * 
 * Retorna el businessId basado en el subdomain/path actual
 * Soporta: /[subdomain]/cliente -> extrae subdomain
 */
export async function GET(request: NextRequest) {
  try {
    // 🎯 PRIORIDAD 1: Obtener de headers (inyectado por middleware)
    let businessId = request.headers.get('x-business-id');
    let subdomain = request.headers.get('x-business-subdomain');
    
    // 🎯 PRIORIDAD 2: Si no hay headers, extraer del Referer
    if (!businessId) {
      const referer = request.headers.get('referer');
      if (referer) {
        const url = new URL(referer);
        const pathParts = url.pathname.split('/').filter(Boolean);
        
        // Patrón: /[subdomain]/cliente
        if (pathParts.length >= 1) {
          subdomain = pathParts[0];
          
          // Validar que no sea una ruta pública
          const publicRoutes = ['login', 'signup', 'api', '_next', 'icons'];
          if (!publicRoutes.includes(subdomain)) {
            // Buscar el business por subdomain
            const response = await fetch(`${url.origin}/api/business/validate?subdomain=${subdomain}`);
            if (response.ok) {
              const data = await response.json();
              businessId = data.businessId;
            }
          }
        }
      }
    }
    
    if (!businessId) {
      return NextResponse.json(
        { 
          error: 'No business context found',
          debug: {
            headers: {
              businessId: request.headers.get('x-business-id'),
              subdomain: request.headers.get('x-business-subdomain')
            },
            referer: request.headers.get('referer')
          }
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      businessId,
      subdomain,
      success: true
    });

  } catch (error) {
    console.error('❌ Error getting business context:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
