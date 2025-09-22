import { promises as fs } from 'fs';
import path from 'path';

/**
 * Crea un portal-config por defecto personalizado para un nuevo business
 * Usa la estructura centralizada y validada del sistema
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
    // ✅ ESTRUCTURA CENTRALIZADA: 5 tarjetas con jerarquía validada
    tarjetas: [
      {
        id: 'tarjeta-bronce',
        nivel: 'Bronce',
        nombrePersonalizado: 'Tarjeta Bronce',
        textoCalidad: 'Cliente Inicial',
        colores: {
          gradiente: ['#CD7F32', '#8B4513'],
          texto: '#FFFFFF',
          nivel: '#CD7F32'
        },
        condiciones: {
          puntosMinimos: 0,
          gastosMinimos: 0,
          visitasMinimas: 0
        },
        beneficio: 'Acceso a promociones exclusivas',
        activo: true
      },
      {
        id: 'tarjeta-plata',
        nivel: 'Plata',
        nombrePersonalizado: 'Tarjeta Plata',
        textoCalidad: 'Cliente Frecuente',
        colores: {
          gradiente: ['#C0C0C0', '#808080'],
          texto: '#FFFFFF',
          nivel: '#C0C0C0'
        },
        condiciones: {
          puntosMinimos: 100,
          gastosMinimos: 500,
          visitasMinimas: 5
        },
        beneficio: '5% de descuento en compras',
        activo: true
      },
      {
        id: 'tarjeta-oro',
        nivel: 'Oro',
        nombrePersonalizado: 'Tarjeta Oro',
        textoCalidad: 'Cliente Premium',
        colores: {
          gradiente: ['#FFD700', '#FFA500'],
          texto: '#000000',
          nivel: '#FFD700'
        },
        condiciones: {
          puntosMinimos: 500,
          gastosMinimos: 1500,
          visitasMinimas: 10
        },
        beneficio: '10% de descuento en compras',
        activo: true
      },
      {
        id: 'tarjeta-diamante',
        nivel: 'Diamante',
        nombrePersonalizado: 'Tarjeta Diamante',
        textoCalidad: 'Cliente VIP',
        colores: {
          gradiente: ['#B9F2FF', '#0891B2'],
          texto: '#FFFFFF',
          nivel: '#B9F2FF'
        },
        condiciones: {
          puntosMinimos: 1500,
          gastosMinimos: 3000,
          visitasMinimas: 20
        },
        beneficio: '15% de descuento en compras',
        activo: true
      },
      {
        id: 'tarjeta-platino',
        nivel: 'Platino',
        nombrePersonalizado: 'Tarjeta Platino',
        textoCalidad: 'Cliente Elite',
        colores: {
          gradiente: ['#E5E7EB', '#9CA3AF'],
          texto: '#FFFFFF',
          nivel: '#E5E7EB'
        },
        condiciones: {
          puntosMinimos: 3000,
          gastosMinimos: 5000,
          visitasMinimas: 30
        },
        beneficio: '20% de descuento en compras',
        activo: true
      }
    ],
    // ✅ FIXED: Usar nombre real del negocio con sistema centralizado
    nombreEmpresa: businessName,
    settings: {
      lastUpdated: new Date().toISOString(),
      version: '2.0.0', // ✅ NUEVA VERSIÓN con sistema centralizado
      createdBy: 'system-central',
      businessId: businessId,
    },
    nivelesConfig: {}, // Compatibilidad
    lastUpdated: new Date().toISOString(),
    version: '2.0.0'
  };

  // Crear archivo business-specific en carpeta organizada
  const configPath = path.join(process.cwd(), 'config', 'portal', `portal-config-${businessId}.json`);
  await fs.writeFile(configPath, JSON.stringify(defaultConfig, null, 2), 'utf-8');
  
  console.log(`✅ Portal config created for business ${businessId} (${businessName}) with centralized card structure`);
  console.log(`📂 Config path: ${configPath}`);
  console.log(`🎯 Cards created: 5 (Bronce → Plata → Oro → Diamante → Platino)`);
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
