import { promises as fs } from 'fs';
import path from 'path';

/**
 * Crea un portal-config por defecto personalizado para un nuevo business
 * @param businessId - ID del business
 * @param businessName - Nombre del business para personalización
 * @returns Promise<PortalConfig>
 */
export async function createDefaultPortalConfig(businessId: string, businessName: string) {
  const defaultConfig = {
    banners: [
      {
        id: 'banner-1',
        title: `¡Bienvenido a ${businessName}!`,
        description: 'Descubre nuestras increíbles ofertas y recompensas exclusivas',
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
        description: `Celebra con nosotros la gran apertura de ${businessName}`,
        location: 'Nuestra ubicación principal',
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000).toISOString(),
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
        description: 'Canjea 500 puntos por un producto de tu elección',
        pointsCost: 500,
        category: 'productos',
        imageUrl: '',
        isActive: true,
        stock: 50,
        availableFrom: new Date().toISOString(),
        availableTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    recompensas: [],
    favorites: [
      {
        id: 'fav-1',
        title: 'Especialidad del Día',
        description: `El producto favorito de ${businessName}`,
        imageUrl: '',
        category: 'destacados',
        price: 12.99,
        isActive: true,
        order: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    favoritoDelDia: [],
    tarjetas: [
      {
        id: 'tarjeta-default',
        nombre: `Tarjeta ${businessName}`,
        descripcion: 'Sistema de lealtad personalizado',
        activa: true,
        condicional: 'OR',
        niveles: [
          {
            nombre: 'Bronce',
            puntosRequeridos: 0,
            visitasRequeridas: 0,
            beneficio: 'Cliente Inicial',
            colores: ['#CD7F32', '#B8860B'],
          },
          {
            nombre: 'Plata',
            puntosRequeridos: 500,
            visitasRequeridas: 10,
            beneficio: 'Cliente Frecuente',
            colores: ['#C0C0C0', '#E8E8E8'],
          },
          {
            nombre: 'Oro',
            puntosRequeridos: 1500,
            visitasRequeridas: 25,
            beneficio: 'Cliente VIP',
            colores: ['#FFD700', '#FFA500'],
          },
        ],
      },
    ],
    // ✅ FIXED: Usar nombre real del negocio en lugar de "Rosita"
    nombreEmpresa: businessName,
    settings: {
      lastUpdated: new Date().toISOString(),
      version: '1.0.0',
      createdBy: 'system',
      businessId: businessId,
    },
  };

  // Crear archivo business-specific en carpeta organizada
  const configPath = path.join(process.cwd(), 'config', 'portal', `portal-config-${businessId}.json`);
  await fs.writeFile(configPath, JSON.stringify(defaultConfig, null, 2), 'utf-8');
  
  console.log(`✅ Portal config created for business ${businessId} (${businessName})`);
  return defaultConfig;
}

/**
 * Función helper para obtener el path del portal config de un business
 * @param businessId - ID del business
 * @returns string - Path absoluto al archivo de configuración
 */
export function getBusinessPortalConfigPath(businessId: string): string {
  return path.join(process.cwd(), 'config', 'portal', `portal-config-${businessId}.json`);
}
