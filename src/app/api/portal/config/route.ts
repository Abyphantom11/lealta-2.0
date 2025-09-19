import { NextResponse, NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    // Obtener businessId del query param para rutas públicas
    const url = new URL(request.url);
    const businessId = url.searchParams.get('businessId') || 'default';
    
    console.log(`📋 Portal config request for business: ${businessId}`);
    
    // ✅ BUSINESS ISOLATION: Solo leer archivo específico del negocio
    const configPath = path.join(process.cwd(), 'config', 'portal', `portal-config-${businessId}.json`);

    // ❌ REMOVED: Sin fallback global para enforcar business isolation
    if (!fs.existsSync(configPath)) {
      console.log(`❌ Business portal config not found for ${businessId}`);
      return NextResponse.json(
        { 
          error: 'Configuración no encontrada para este negocio',
          businessId: businessId,
          message: 'El administrador debe configurar el portal primero'
        },
        { status: 404 }
      );
    }

    console.log(`✅ Using business-specific portal config for ${businessId}`);

    // 🔥 CACHE INVALIDATION: Limpiar cache de Node.js para forzar lectura fresca
    try {
      delete require.cache[require.resolve(configPath)];
      console.log(`🗑️ Cache cleared for: ${configPath}`);
    } catch (cacheError: any) {
      console.log(`⚠️ Could not clear cache for: ${configPath}`, cacheError?.message || 'Unknown error');
    }

    // 📖 Leer archivo fresco (sin cache) específico del business
    const configData = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(configData);

    console.log(`📋 Portal config loaded FRESH (no cache) for business ${businessId} at ${new Date().toLocaleTimeString()}`);
    
    // 🚫 Headers anti-cache para el cliente
    const response = NextResponse.json(config);
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    response.headers.set('Surrogate-Control', 'no-store');
    
    return response;
  } catch (error) {
    console.error('Error leyendo configuración del portal:', error);
    return NextResponse.json(
      { error: 'Error leyendo configuración del portal' },
      { status: 500 }
    );
  }
}
