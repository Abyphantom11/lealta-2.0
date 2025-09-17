import { NextResponse, NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    // Obtener businessId del query param para rutas públicas
    const url = new URL(request.url);
    const businessId = url.searchParams.get('businessId') || 'default';
    
    console.log(`📋 Portal config request for business: ${businessId}`);
    
    // Usar archivo específico del negocio si existe
    let configPath = path.join(process.cwd(), `portal-config-${businessId}.json`);
    
    // Fallback al archivo general si no existe el específico
    if (!fs.existsSync(configPath)) {
      configPath = path.join(process.cwd(), 'portal-config.json');
      console.log(`⚠️ Business portal config not found for ${businessId}, using fallback`);
    } else {
      console.log(`✅ Using business-specific portal config for ${businessId}`);
    }

    if (!fs.existsSync(configPath)) {
      return NextResponse.json(
        { error: 'Archivo de configuración no encontrado' },
        { status: 404 }
      );
    }

    const configData = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(configData);

    console.log(`📋 Portal config loaded for business ${businessId}`);
    return NextResponse.json(config);
  } catch (error) {
    console.error('Error leyendo configuración del portal:', error);
    return NextResponse.json(
      { error: 'Error leyendo configuración del portal' },
      { status: 500 }
    );
  }
}
