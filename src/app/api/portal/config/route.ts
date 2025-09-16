import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: Request) {
  try {
    // Obtener businessId del query param
    const url = new URL(request.url);
    const businessId = url.searchParams.get('businessId') || 'default';
    
    // Usar archivo específico del negocio si existe
    let configPath = path.join(process.cwd(), `portal-config-${businessId}.json`);
    
    // Fallback al archivo general si no existe el específico
    if (!fs.existsSync(configPath)) {
      configPath = path.join(process.cwd(), 'portal-config.json');
    }

    if (!fs.existsSync(configPath)) {
      return NextResponse.json(
        { error: 'Archivo de configuración no encontrado' },
        { status: 404 }
      );
    }

    const configData = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(configData);

    return NextResponse.json(config);
  } catch (error) {
    console.error('Error leyendo configuración del portal:', error);
    return NextResponse.json(
      { error: 'Error leyendo configuración del portal' },
      { status: 500 }
    );
  }
}
