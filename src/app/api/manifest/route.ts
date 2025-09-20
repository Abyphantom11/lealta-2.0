import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const searchParams = url.searchParams;
  
  // Obtener el business slug desde los parámetros de la URL
  const businessSlug = searchParams.get('business') || searchParams.get('slug');
  
  // Si no hay business slug, usar manifest genérico
  if (!businessSlug) {
    const manifest = {
      "name": "Lealta",
      "short_name": "Lealta",
      "description": "Sistema de fidelización inteligente",
      "start_url": "/",
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

  // Manifest específico para el negocio
  const businessManifest = {
    "name": `Lealta - ${businessSlug.charAt(0).toUpperCase() + businessSlug.slice(1)}`,
    "short_name": businessSlug.charAt(0).toUpperCase() + businessSlug.slice(1),
    "description": `App de fidelización para ${businessSlug}`,
    "start_url": `/${businessSlug}/cliente`,
    "display": "standalone",
    "background_color": "#1a1a1a",
    "theme_color": "#3b82f6",
    "orientation": "portrait-primary",
    "scope": `/${businessSlug}/`,
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
      'Cache-Control': 'public, max-age=3600'
    }
  });
}
