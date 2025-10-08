import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // 🎯 Obtener business context de headers (inyectado por middleware)
  const businessId = request.headers.get('x-business-id');
  const subdomain = request.headers.get('x-business-subdomain');
  
  // Fallback: Intentar desde query params si no hay headers
  const searchParams = request.nextUrl.searchParams;
  const businessSlug = subdomain || searchParams.get('business') || searchParams.get('slug');
  
  // Si no hay business slug, usar manifest genérico
  if (!businessSlug) {
    const manifest = {
      "name": "Lealta",
      "short_name": "Lealta",
      "description": "Sistema de fidelización inteligente",
      "start_url": "/cliente",  // ✅ Start en /cliente genérico
      "display": "standalone",
      "background_color": "#1a1a1a",
      "theme_color": "#3b82f6",
      "orientation": "any",
      "scope": "/",
      "lang": "es",
      "icons": [
        {
          "src": "/icons/icon-192.svg",
          "sizes": "192x192",
          "type": "image/svg+xml",
          "purpose": "any maskable"
        },
        {
          "src": "/icons/icon-512.svg",
          "sizes": "512x512",
          "type": "image/svg+xml",
          "purpose": "any maskable"
        }
      ]
    };

    return NextResponse.json(manifest, {
      headers: {
        'Content-Type': 'application/manifest+json',
        'Cache-Control': 'public, max-age=3600'
      }
    });
  }

  // Manifest específico para el negocio con start_url dinámico
  const businessManifest = {
    "name": `Lealta - ${businessSlug.charAt(0).toUpperCase() + businessSlug.slice(1)}`,
    "short_name": businessSlug.charAt(0).toUpperCase() + businessSlug.slice(1),
    "description": `App de fidelización para ${businessSlug}`,
    "start_url": `/${businessSlug}/cliente`,  // ✅ Start en /[subdomain]/cliente
    "display": "standalone",
    "background_color": "#1a1a1a",
    "theme_color": "#3b82f6",
    "orientation": "portrait-primary",
    "scope": `/${businessSlug}/`,  // ✅ Scope específico del negocio
    "lang": "es",
    "categories": ["business", "lifestyle", "shopping"],
    "prefer_related_applications": false,
    "icons": [
      {
        "src": "/icons/icon-base.svg",
        "sizes": "72x72",
        "type": "image/svg+xml",
        "purpose": "any"
      },
      {
        "src": "/icons/icon-base.svg",
        "sizes": "96x96",
        "type": "image/svg+xml",
        "purpose": "any"
      },
      {
        "src": "/icons/icon-base.svg",
        "sizes": "128x128",
        "type": "image/svg+xml",
        "purpose": "any"
      },
      {
        "src": "/icons/icon-base.svg",
        "sizes": "144x144",
        "type": "image/svg+xml",
        "purpose": "any"
      },
      {
        "src": "/icons/icon-base.svg",
        "sizes": "152x152",
        "type": "image/svg+xml",
        "purpose": "any"
      },
      {
        "src": "/icons/icon-192.svg",
        "sizes": "192x192",
        "type": "image/svg+xml",
        "purpose": "any"
      },
      {
        "src": "/icons/icon-192.svg",
        "sizes": "384x384",
        "type": "image/svg+xml",
        "purpose": "any"
      },
      {
        "src": "/icons/icon-512.svg",
        "sizes": "512x512",
        "type": "image/svg+xml",
        "purpose": "any"
      },
      {
        "src": "/icons/icon-192.svg",
        "sizes": "192x192",
        "type": "image/svg+xml",
        "purpose": "maskable"
      },
      {
        "src": "/icons/icon-512.svg",
        "sizes": "512x512",
        "type": "image/svg+xml",
        "purpose": "maskable"
      }
    ],
    "shortcuts": [
      {
        "name": "Mi Perfil",
        "short_name": "Perfil",
        "description": "Ver mi perfil y tarjeta de fidelización",
        "url": `/${businessSlug}/cliente/perfil`,
        "icons": [{"src": "/icons/icon-192.svg", "sizes": "192x192"}]
      },
      {
        "name": "Promociones",
        "short_name": "Ofertas",
        "description": "Ver promociones y ofertas especiales",
        "url": `/${businessSlug}/cliente/promociones`,
        "icons": [{"src": "/icons/icon-192.svg", "sizes": "192x192"}]
      }
    ]
  };

  console.log('🔧 Manifest dinámico generado para:', businessSlug);
  console.log('🔧 Start URL:', businessManifest.start_url);
  console.log('🔧 Scope:', businessManifest.scope);

  return NextResponse.json(businessManifest, {
    headers: {
      'Content-Type': 'application/manifest+json',
      // ⚠️ Cache corto para permitir actualizaciones rápidas en desarrollo
      // En producción iOS cachea agresivamente de todos modos
      'Cache-Control': 'public, max-age=300, must-revalidate', // 5 minutos
      'X-Business-Slug': businessSlug // Debug header
    }
  });
}
