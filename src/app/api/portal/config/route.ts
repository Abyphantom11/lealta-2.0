import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Configurar como ruta dinámica
export const dynamic = 'force-dynamic';

// API pública para obtener configuración del portal (solo lectura)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId') || 'default';
    const simulateDay = searchParams.get('simulateDay');
    
    console.log(`📋 Portal config público request for business: ${businessId}`);
    
    // Leer configuración desde archivo JSON
    const configPath = path.join(process.cwd(), 'config', 'portal', `portal-config-${businessId}.json`);
    
    if (!fs.existsSync(configPath)) {
      console.log(`⚠️ Config file not found: ${configPath}`);
      // Devolver configuración por defecto
      return NextResponse.json({
        success: true,
        data: {
          nombreEmpresa: 'Mi Negocio',
          tarjetas: [],
          nivelesConfig: {},
          banners: [],
          promociones: [],
          recompensas: [],
          sectionTitles: {
            banners: 'Ofertas Especiales',
            promociones: 'Promociones', 
            recompensas: 'Recompensas',
            tarjetas: 'Beneficios'
          }
        }
      });
    }

    const fileContent = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(fileContent);

    // Si hay simulación de día, aplicar configuración específica
    if (simulateDay) {
      const dayConfig = config.dayConfigs?.[simulateDay];
      if (dayConfig) {
        // Aplicar configuración del día simulado
        Object.assign(config, dayConfig);
      }
    }

    // Estructura de respuesta consistente
    const responseData = {
      nombreEmpresa: config.nombreEmpresa || 'Mi Negocio',
      tarjetas: config.tarjetas || [],
      nivelesConfig: config.nivelesConfig || {},
      banners: config.banners || [],
      promociones: config.promociones || [],
      recompensas: config.recompensas || [],
      sectionTitles: config.sectionTitles || {
        banners: 'Ofertas Especiales',
        promociones: 'Promociones',
        recompensas: 'Recompensas', 
        tarjetas: 'Beneficios'
      },
      favoritoDelDia: config.favoritoDelDia || null,
      // Solo incluir datos públicos, no datos sensibles de admin
      lastUpdated: config.lastUpdated || new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error('❌ Error in portal config público:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error interno del servidor',
        data: {
          nombreEmpresa: 'Mi Negocio',
          tarjetas: [],
          nivelesConfig: {},
          banners: [],
          promociones: [],
          recompensas: [],
          sectionTitles: {
            banners: 'Ofertas Especiales',
            promociones: 'Promociones',
            recompensas: 'Recompensas',
            tarjetas: 'Beneficios'
          }
        }
      },
      { status: 500 }
    );
  }
}
