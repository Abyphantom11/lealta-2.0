import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { PortalConfig } from '../../../../types/api-routes';

// Configurar como ruta dinámica para permitir el uso de request.url
export const dynamic = 'force-dynamic';

const PORTAL_CONFIG_PATH = path.join(process.cwd(), 'portal-config.json');

// Importar función de notificación SSE
async function notifyConfigChange() {
  try {
    // Importación dinámica para evitar problemas de ciclo
    const { notifyConfigChange: notifySSE } = await import('../../../../lib/sse-notifications');
    await notifySSE();
  } catch (error) {
    console.log('⚠️ No se pudo notificar cambios SSE:', error);
  }
}

// Función auxiliar para leer la configuración del portal
async function readPortalConfig() {
  try {
    const data = await fs.readFile(PORTAL_CONFIG_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // Si el archivo no existe, crear configuración por defecto
    console.log('Creando configuración por defecto del portal:', error instanceof Error ? error.message : 'Error desconocido');
    
    const defaultConfig = {
      banners: [
        {
          id: "banner-1",
          title: "¡Bienvenido a Lealta!",
          description: "Descubre nuestras increibles ofertas y recompensas exclusivas",
          imageUrl: "/api/placeholder/800/400",
          linkUrl: "/promociones",
          isActive: true,
          order: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ],
      promotions: [
        {
          id: "promo-1",
          title: "Descuento Especial",
          description: "20% de descuento en tu primera compra",
          discount: 20,
          type: "percentage",
          code: "BIENVENIDO20",
          validFrom: new Date().toISOString(),
          validTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          isActive: true,
          maxUses: 100,
          currentUses: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ],
      promociones: [],
      events: [
        {
          id: "event-1",
          title: "Gran Apertura",
          description: "Celebra con nosotros la gran apertura de nuestra nueva tienda",
          location: "Centro Comercial Plaza Norte",
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000).toISOString(),
          imageUrl: "/api/placeholder/600/300",
          isActive: true,
          maxAttendees: 200,
          currentAttendees: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ],
      rewards: [
        {
          id: "reward-1",
          title: "Producto Gratis",
          description: "Canjea 500 puntos por un producto de tu eleccion",
          pointsCost: 500,
          category: "productos",
          imageUrl: "/api/placeholder/300/300",
          isActive: true,
          stock: 50,
          availableFrom: new Date().toISOString(),
          availableTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ],
      recompensas: [],
      favorites: [
        {
          id: "fav-1",
          title: "Cafe Premium",
          description: "Nuestro cafe de especialidad mas popular",
          imageUrl: "/api/placeholder/400/300",
          category: "bebidas",
          price: 12.99,
          isActive: true,
          order: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ],
      favoritoDelDia: [],
      tarjetas: [],
      nombreEmpresa: 'LEALTA 2.0',
      settings: {
        lastUpdated: new Date().toISOString(),
        version: "1.0.0"
      }
    };

    await fs.writeFile(PORTAL_CONFIG_PATH, JSON.stringify(defaultConfig, null, 2), 'utf-8');
    return defaultConfig;
  }
}

// Función auxiliar para escribir la configuración del portal
async function writePortalConfig(config: PortalConfig): Promise<PortalConfig> {
  config.settings = {
    ...config.settings,
    lastUpdated: new Date().toISOString()
  };
  
  await fs.writeFile(PORTAL_CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
  return config;
}

// GET - Obtener configuración del portal
export async function GET() {
  try {
    const portalConfig = await readPortalConfig();

    return NextResponse.json({
      success: true,
      config: portalConfig,
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store',
      }
    });
  } catch (error) {
    console.error('Error obteniendo configuración del portal:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar configuración del portal
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      banners,
      promotions,
      promociones,
      events,
      rewards,
      recompensas,
      favorites,
      favoritoDelDia,
      tarjetas,
      nombreEmpresa,
      settings,
    } = body;

    // Leer configuración actual
    const currentConfig = await readPortalConfig();

    // Actualizar con los nuevos datos
    const updatedConfig = {
      ...currentConfig,
      ...(banners && { banners }),
      ...(promotions && { promotions }),
      ...(promociones && { promociones }),
      ...(events && { events }),
      ...(rewards && { rewards }),
      ...(recompensas && { recompensas }),
      ...(favorites && { favorites }),
      ...(favoritoDelDia && { favoritoDelDia }),
      ...(tarjetas && { tarjetas }),
      ...(nombreEmpresa !== undefined && { nombreEmpresa }),
      ...(settings && { settings: { ...currentConfig.settings, ...settings } }),
    };

    // Guardar configuración actualizada
    const savedConfig = await writePortalConfig(updatedConfig);
    
    // Notificar cambios a clientes conectados via SSE
    await notifyConfigChange();
    console.log('📡 Notificación SSE enviada a clientes');

    return NextResponse.json({
      success: true,
      config: savedConfig,
    });
  } catch (error) {
    console.error('Error actualizando configuración del portal:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
