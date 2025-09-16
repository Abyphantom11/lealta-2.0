import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { PortalConfig } from '../../../../types/api-routes';
import { withAuth, AuthConfigs } from '../../../../middleware/requireAuth';

// Configurar como ruta dinámica para permitir el uso de request.url
export const dynamic = 'force-dynamic';

const PORTAL_CONFIG_PATH = path.join(process.cwd(), 'portal-config.json');

// Importar función de notificación SSE
async function notifyConfigChange() {
  try {
    // Importación dinámica para evitar problemas de ciclo
    const { notifyConfigChange: notifySSE } = await import(
      '../../../../lib/sse-notifications'
    );
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
    console.log(
      'Creando configuración por defecto del portal:',
      error instanceof Error ? error.message : 'Error desconocido'
    );

    const defaultConfig = {
      banners: [
        {
          id: 'banner-1',
          title: '¡Bienvenido a Lealta!',
          description:
            'Descubre nuestras increibles ofertas y recompensas exclusivas',
          imageUrl: '',
          linkUrl: '/promociones',
          isActive: true,
          order: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      promotions: [],
      promociones: [],
      events: [
        {
          id: 'event-1',
          title: 'Gran Apertura',
          description:
            'Celebra con nosotros la gran apertura de nuestra nueva tienda',
          location: 'Centro Comercial Plaza Norte',
          startDate: new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000
          ).toISOString(),
          endDate: new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000
          ).toISOString(),
          imageUrl: '',
          isActive: true,
          maxAttendees: 200,
          currentAttendees: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      rewards: [
        {
          id: 'reward-1',
          title: 'Producto Gratis',
          description: 'Canjea 500 puntos por un producto de tu eleccion',
          pointsCost: 500,
          category: 'productos',
          imageUrl: '',
          isActive: true,
          stock: 50,
          availableFrom: new Date().toISOString(),
          availableTo: new Date(
            Date.now() + 365 * 24 * 60 * 60 * 1000
          ).toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      recompensas: [],
      favorites: [
        {
          id: 'fav-1',
          title: 'Cafe Premium',
          description: 'Nuestro cafe de especialidad mas popular',
          imageUrl: '',
          category: 'bebidas',
          price: 12.99,
          isActive: true,
          order: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      favoritoDelDia: [],
      tarjetas: [],
      nombreEmpresa: 'Rosita',
      settings: {
        lastUpdated: new Date().toISOString(),
        version: '1.0.0',
      },
    };

    await fs.writeFile(
      PORTAL_CONFIG_PATH,
      JSON.stringify(defaultConfig, null, 2),
      'utf-8'
    );
    return defaultConfig;
  }
}

// Función auxiliar para escribir la configuración del portal
async function writePortalConfig(config: PortalConfig): Promise<PortalConfig> {
  config.settings = {
    ...config.settings,
    lastUpdated: new Date().toISOString(),
  };

  await fs.writeFile(
    PORTAL_CONFIG_PATH,
    JSON.stringify(config, null, 2),
    'utf-8'
  );
  return config;
}

// 🔒 GET - Obtener configuración del portal (PROTEGIDO)
export async function GET(request: NextRequest) {
  return withAuth(request, async (session) => {
    try {
      console.log(`🔍 Portal config access by: ${session.role} (${session.userId})`);
      
      // Leer directamente del archivo para garantizar datos frescos
      const portalConfig = await readPortalConfig();

      return NextResponse.json(
        {
          success: true,
          config: portalConfig,
          timestamp: new Date().toISOString(),
          accessedBy: session.userId // Para auditoría
        },
        {
          headers: {
            'Cache-Control':
              'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
            Pragma: 'no-cache',
            Expires: '-1',
            'Surrogate-Control': 'no-store',
            Vary: '*',
          },
        }
      );
    } catch (error) {
      console.error('❌ Error obteniendo configuración del portal:', error);
      return NextResponse.json(
        { error: 'Error interno del servidor' },
        { status: 500 }
      );
    }
  }, AuthConfigs.READ_ONLY);
}

// 🔒 PUT - Actualizar configuración del portal (PROTEGIDO - ADMIN ONLY)
export async function PUT(request: NextRequest) {
  return withAuth(request, async (session) => {
    try {
      console.log(`🔧 Portal config update by: ${session.role} (${session.userId})`);
      
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
        // Agregar metadata de auditoría
        lastModifiedBy: session.userId,
        lastModifiedAt: new Date().toISOString(),
        lastModifiedRole: session.role
      };

      // Guardar configuración actualizada
      const savedConfig = await writePortalConfig(updatedConfig);

      // Notificar cambios a clientes conectados via SSE
      await notifyConfigChange();

      console.log(`✅ Portal config updated successfully by ${session.role}`);
      return NextResponse.json({
        success: true,
        config: savedConfig,
        updatedBy: session.userId
      });
    } catch (error) {
      console.error('❌ Error actualizando configuración del portal:', error);
      return NextResponse.json(
        { error: 'Error interno del servidor' },
        { status: 500 }
      );
    }
  }, AuthConfigs.ADMIN_ONLY);
}
