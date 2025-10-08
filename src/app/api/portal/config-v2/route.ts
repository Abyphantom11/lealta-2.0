import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getBusinessIdFromRequest } from '@/lib/business-utils';
import { getTarjetasConfigCentral } from '@/lib/tarjetas-config-central';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

// 🔄 Función auxiliar para obtener configuración usando sistema central
async function getAdminTarjetas(businessId: string) {
  try {
    const config = await getTarjetasConfigCentral(businessId);
    
    if (config.erroresValidacion.length > 0) {
      console.warn(`⚠️ Errores de validación para ${businessId}:`, config.erroresValidacion);
    }
    
    return {
      tarjetas: config.tarjetas || [],
      nombreEmpresa: config.nombreEmpresa || 'Sistema Lealta',
      jerarquiaValida: config.jerarquiaValida,
      erroresValidacion: config.erroresValidacion
    };
  } catch (error) {
    console.error(`❌ Error obteniendo config central para ${businessId}:`, error);
    return null;
  }
}

// GET - Obtener configuración completa del portal desde la BD
export async function GET(request: NextRequest) {
  try {
    // Obtener businessId del query param (para rutas públicas) o headers (para rutas autenticadas)
    const searchParams = request.nextUrl.searchParams;
    const queryBusinessId = searchParams.get('businessId');
    const headerBusinessId = getBusinessIdFromRequest(request);
    const simulateDay = searchParams.get('simulateDay'); // 🆕 Parámetro para simular día
    
    const businessId = queryBusinessId || headerBusinessId;
    
    if (!businessId) {
      return NextResponse.json(
        { error: 'Business ID requerido' },
        { status: 400 }
      );
    }

    // Obtener información del business
    const business = await prisma.business.findUnique({
      where: { id: businessId }
    });

    if (!business) {
      return NextResponse.json(
        { 
          error: 'Negocio no encontrado',
          businessId: businessId,
          message: 'El negocio especificado no existe'
        },
        { status: 404 }
      );
    }

    // Obtener día comercial actual para filtrar contenido
    // 🆕 Si viene simulateDay, usar ese día; de lo contrario, calcular el día comercial
    const { getCurrentBusinessDay } = await import('@/lib/business-day-utils');
    const currentBusinessDay = simulateDay || await getCurrentBusinessDay(businessId);
    
    console.log('🗓️ Día para filtrar contenido:', {
      simulateDay,
      currentBusinessDay,
      isSimulated: !!simulateDay
    });

    // Obtener todos los datos del portal en paralelo para mejor performance
    const [
      banners,
      promociones,
      recompensas,
      favoritoDelDia,
      tarjetasConfig
    ] = await Promise.all([
      // Banners activos ordenados y filtrados por día comercial
      prisma.portalBanner.findMany({
        where: {
          businessId,
          active: true,
          OR: [
            { dia: currentBusinessDay }, // Banners específicos del día
            { dia: null }, // Banners sin día específico (todos los días)
            { dia: '' } // Banners sin día específico (todos los días)
          ]
        },
        orderBy: { orden: 'asc' }
      }),
      
      // Promociones activas y vigentes ordenadas, filtradas por día comercial
      prisma.portalPromocion.findMany({
        where: {
          businessId,
          active: true,
          AND: [
            {
              OR: [
                { validUntil: null }, // Sin fecha de vencimiento
                { validUntil: { gte: new Date() } } // Vigentes
              ]
            },
            {
              OR: [
                { dia: currentBusinessDay }, // Promociones específicas del día
                { dia: null }, // Promociones sin día específico (todos los días)
                { dia: '' } // Promociones sin día específico (todos los días)
              ]
            }
          ]
        },
        orderBy: { orden: 'asc' }
      }),
      
      // Recompensas activas con stock disponible
      prisma.portalRecompensa.findMany({
        where: {
          businessId,
          active: true,
          OR: [
            { unlimited: true }, // Recompensas ilimitadas
            { stock: { gt: 0 } }, // O con stock disponible
            { stock: null } // O sin configuración de stock (valor por defecto)
          ]
        },
        orderBy: [
          { orden: 'asc' },
          { pointsCost: 'asc' }
        ]
      }),
      
      // ✅ Favorito del día activo filtrado por día comercial
      prisma.portalFavoritoDelDia.findFirst({
        where: {
          businessId,
          active: true,
          OR: [
            { dia: currentBusinessDay }, // Favorito específico del día
            { dia: null }, // Favorito sin día específico (todos los días)
            { dia: '' } // Favorito sin día específico (todos los días)
          ]
        },
        orderBy: { createdAt: 'desc' }
      }),
      
      // Configuración de tarjetas
      prisma.portalTarjetasConfig.findUnique({
        where: { businessId }
      })
    ]);

    // Transformar datos al formato esperado por el frontend
    const config = {
      // BANNERS - Formato compatible
      banners: banners.map(banner => ({
        id: banner.id,
        titulo: banner.title,
        title: banner.title, // Compatibilidad dual
        descripcion: banner.description || '',
        description: banner.description || '', // Compatibilidad dual
        imagen: banner.imageUrl || '',
        imagenUrl: banner.imageUrl || '',
        imageUrl: banner.imageUrl || '', // Compatibilidad dual
        linkUrl: banner.linkUrl || '',
        activo: banner.active,
        isActive: banner.active, // Compatibilidad dual
        orden: banner.orden,
        order: banner.orden, // Compatibilidad dual
        createdAt: banner.createdAt.toISOString(),
        updatedAt: banner.updatedAt.toISOString()
      })),

      // PROMOCIONES - Formato compatible (tanto 'promotions' como 'promociones')
      promotions: promociones.map(promo => ({
        id: promo.id,
        titulo: promo.title,
        title: promo.title, // Compatibilidad dual
        descripcion: promo.description || '',
        description: promo.description || '', // Compatibilidad dual
        imagen: promo.imageUrl || '',
        imagenUrl: promo.imageUrl || '',
        imageUrl: promo.imageUrl || '', // Compatibilidad dual
        descuento: promo.discount || '',
        discount: promo.discount || '', // Compatibilidad dual
        validUntil: promo.validUntil?.toISOString() || null,
        activo: promo.active,
        isActive: promo.active, // Compatibilidad dual
        orden: promo.orden,
        order: promo.orden, // Compatibilidad dual
        createdAt: promo.createdAt.toISOString(),
        updatedAt: promo.updatedAt.toISOString()
      })),
      promociones: promociones.map(promo => ({
        id: promo.id,
        titulo: promo.title,
        title: promo.title, // Compatibilidad dual
        descripcion: promo.description || '',
        description: promo.description || '', // Compatibilidad dual
        imagen: promo.imageUrl || '',
        imagenUrl: promo.imageUrl || '',
        imageUrl: promo.imageUrl || '', // Compatibilidad dual
        descuento: promo.discount || '',
        discount: promo.discount || '', // Compatibilidad dual
        validUntil: promo.validUntil?.toISOString() || null,
        activo: promo.active,
        isActive: promo.active, // Compatibilidad dual
        orden: promo.orden,
        order: promo.orden, // Compatibilidad dual
        createdAt: promo.createdAt.toISOString(),
        updatedAt: promo.updatedAt.toISOString()
      })),

      // RECOMPENSAS - Formato compatible (tanto 'rewards' como 'recompensas')
      rewards: recompensas.map(reward => ({
        id: reward.id,
        titulo: reward.title,
        title: reward.title, // Compatibilidad dual
        nombre: reward.title, // Para componentes que usan 'nombre'
        descripcion: reward.description || '',
        description: reward.description || '', // Compatibilidad dual
        puntosRequeridos: reward.pointsCost,
        pointsCost: reward.pointsCost, // Compatibilidad dual
        categoria: reward.category || 'general',
        category: reward.category || 'general', // Compatibilidad dual
        imagen: reward.imageUrl || '',
        imagenUrl: reward.imageUrl || '',
        imageUrl: reward.imageUrl || '', // Compatibilidad dual
        activo: reward.active,
        isActive: reward.active, // Compatibilidad dual
        stock: reward.unlimited ? 999999 : (reward.stock || 0),
        unlimited: reward.unlimited,
        availableFrom: reward.createdAt.toISOString(),
        availableTo: null, // Por ahora no manejamos fecha de fin
        createdAt: reward.createdAt.toISOString(),
        updatedAt: reward.updatedAt.toISOString()
      })),
      recompensas: recompensas.map(reward => ({
        id: reward.id,
        titulo: reward.title,
        title: reward.title, // Compatibilidad dual
        nombre: reward.title, // Para componentes que usan 'nombre'
        descripcion: reward.description || '',
        description: reward.description || '', // Compatibilidad dual
        puntosRequeridos: reward.pointsCost,
        pointsCost: reward.pointsCost, // Compatibilidad dual
        categoria: reward.category || 'general',
        category: reward.category || 'general', // Compatibilidad dual
        imagen: reward.imageUrl || '',
        imagenUrl: reward.imageUrl || '',
        imageUrl: reward.imageUrl || '', // Compatibilidad dual
        activo: reward.active,
        isActive: reward.active, // Compatibilidad dual
        stock: reward.unlimited ? 999999 : (reward.stock || 0),
        unlimited: reward.unlimited,
        availableFrom: reward.createdAt.toISOString(),
        availableTo: null,
        createdAt: reward.createdAt.toISOString(),
        updatedAt: reward.updatedAt.toISOString()
      })),

      // FAVORITO DEL DÍA - Formato compatible (tanto 'favorites' como 'favoritoDelDia')
      favorites: favoritoDelDia ? [{
        id: favoritoDelDia.id,
        titulo: favoritoDelDia.productName,
        title: favoritoDelDia.productName, // Compatibilidad dual
        nombre: favoritoDelDia.productName, // Para componentes que usan 'nombre'
        descripcion: favoritoDelDia.description || '',
        description: favoritoDelDia.description || '', // Compatibilidad dual
        imagen: favoritoDelDia.imageUrl || '',
        imagenUrl: favoritoDelDia.imageUrl || '',
        imageUrl: favoritoDelDia.imageUrl || '', // Compatibilidad dual
        categoria: 'destacados',
        category: 'destacados', // Compatibilidad dual
        precio: favoritoDelDia.specialPrice || favoritoDelDia.originalPrice || 0,
        price: favoritoDelDia.specialPrice || favoritoDelDia.originalPrice || 0, // Compatibilidad dual
        originalPrice: favoritoDelDia.originalPrice,
        specialPrice: favoritoDelDia.specialPrice,
        specialOffer: favoritoDelDia.specialOffer,
        activo: favoritoDelDia.active,
        isActive: favoritoDelDia.active, // Compatibilidad dual
        orden: 1,
        order: 1, // Compatibilidad dual
        dia: new Date(favoritoDelDia.date).toLocaleDateString('es-ES', { weekday: 'long' }),
        horaPublicacion: '09:00', // Valor por defecto
        date: favoritoDelDia.date.toISOString(),
        createdAt: favoritoDelDia.createdAt.toISOString(),
        updatedAt: favoritoDelDia.updatedAt.toISOString()
      }] : [],
      favoritoDelDia: favoritoDelDia ? [{
        id: favoritoDelDia.id,
        titulo: favoritoDelDia.productName,
        title: favoritoDelDia.productName, // Compatibilidad dual
        nombre: favoritoDelDia.productName, // Para componentes que usan 'nombre'
        descripcion: favoritoDelDia.description || '',
        description: favoritoDelDia.description || '', // Compatibilidad dual
        imagen: favoritoDelDia.imageUrl || '',
        imagenUrl: favoritoDelDia.imageUrl || '',
        imageUrl: favoritoDelDia.imageUrl || '', // Compatibilidad dual
        originalPrice: favoritoDelDia.originalPrice,
        specialPrice: favoritoDelDia.specialPrice,
        specialOffer: favoritoDelDia.specialOffer,
        activo: favoritoDelDia.active,
        isActive: favoritoDelDia.active, // Compatibilidad dual
        dia: new Date(favoritoDelDia.date).toLocaleDateString('es-ES', { weekday: 'long' }),
        horaPublicacion: '09:00', // Valor por defecto
        date: favoritoDelDia.date.toISOString(),
        createdAt: favoritoDelDia.createdAt.toISOString(),
        updatedAt: favoritoDelDia.updatedAt.toISOString()
      }] : [],

      // CONFIGURACIÓN DE TARJETAS - ✅ PRIORIZAR ADMIN CONFIG
      tarjetas: await (async () => {
        const adminConfig = await getAdminTarjetas(businessId);
        if (adminConfig?.tarjetas && adminConfig.tarjetas.length > 0) {
          // ✅ NUEVA ESTRUCTURA: adminConfig.tarjetas es directamente un array de tarjetas
          return adminConfig.tarjetas.map((tarjeta: any) => ({
            id: tarjeta.id || `tarjeta-${tarjeta.nivel?.toLowerCase()}`,
            nivel: tarjeta.nivel,
            nombrePersonalizado: tarjeta.nombrePersonalizado || `Tarjeta ${tarjeta.nivel}`,
            textoCalidad: tarjeta.textoCalidad || tarjeta.beneficio || `Cliente ${tarjeta.nivel}`,
            colores: {
              gradiente: tarjeta.colores?.gradiente || ['#666666', '#999999'],
              texto: tarjeta.colores?.texto || '#FFFFFF',
              nivel: tarjeta.colores?.nivel || tarjeta.colores?.gradiente?.[0] || '#666666'
            },
            condiciones: {
              puntosMinimos: tarjeta.condiciones?.puntosMinimos || 0,
              gastosMinimos: tarjeta.condiciones?.gastosMinimos || 0,
              visitasMinimas: tarjeta.condiciones?.visitasMinimas || 0
            },
            beneficio: tarjeta.beneficio || `Cliente ${tarjeta.nivel}`,
            activo: tarjeta.activo !== undefined ? tarjeta.activo : true
          }));
        }
        // Fallback: usar BD como antes
        return [{
          id: 'tarjeta-default',
          nombre: `Tarjeta ${business.name}`,
          descripcion: 'Sistema de lealtad personalizado',
          activa: true,
          condicional: 'OR',
          niveles: generateNiveles(tarjetasConfig)
        }];
      })(),

      // EVENTOS - Por ahora vacío (se puede agregar después)
      events: [],

      // METADATA - ✅ USAR ADMIN CONFIG PARA NOMBRE EMPRESA
      nombreEmpresa: await (async () => {
        const adminConfig = await getAdminTarjetas(businessId);
        return adminConfig?.nombreEmpresa || business.name;
      })(),
      settings: {
        lastUpdated: new Date().toISOString(),
        version: '2.0.0', // Nueva versión con BD
        createdBy: 'database',
        businessId: business.id,
        dataSource: await (async () => {
          const adminConfig = await getAdminTarjetas(businessId);
          return adminConfig ? 'admin-json-primary' : 'database-fallback';
        })()
      },
      // ✅ NUEVA METADATA: Info del día comercial para debugging y validación
      _metadata: await (async () => {
        const { getBusinessDayRange, getBusinessDayDebugInfo } = await import('@/lib/business-day-utils');
        try {
          const debugInfo = await getBusinessDayDebugInfo(businessId);
          const { start, end } = await getBusinessDayRange(businessId);
          
          return {
            businessDay: debugInfo.businessDay,
            naturalDay: debugInfo.naturalDay,
            fetchedAt: new Date().toISOString(),
            validFrom: start.toISOString(),
            validUntil: end.toISOString(),
            resetHour: debugInfo.config.resetHour,
            isAfterReset: debugInfo.isAfterReset,
            note: 'Los datos son válidos hasta validUntil. Después de esa hora, el cliente debe refrescar para obtener datos del siguiente día comercial.'
          };
        } catch (error) {
          console.warn('Error obteniendo metadata de día comercial:', error);
          return {
            businessDay: 'unknown',
            fetchedAt: new Date().toISOString(),
            error: 'Could not determine business day'
          };
        }
      })()
    };
    
    // Headers anti-cache para el cliente (mantener compatibilidad)
    const response = NextResponse.json(config);
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    response.headers.set('Surrogate-Control', 'no-store');
    
    return response;
  } catch (error) {
    console.error('Error obteniendo configuración del portal v2:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * Genera la configuración de niveles basada en la configuración de tarjetas
 * o usa valores por defecto si no existe configuración
 */
function generateNiveles(tarjetasConfig: any) {
  const defaultNiveles = [
    {
      nombre: 'Bronce',
      puntosRequeridos: 0,
      visitasRequeridas: 0,
      beneficio: 'Cliente Inicial',
      colores: ['#CD7F32', '#B8860B']
    },
    {
      nombre: 'Plata',
      puntosRequeridos: 1000,
      visitasRequeridas: 10,
      beneficio: 'Cliente Frecuente',
      colores: ['#C0C0C0', '#E8E8E8']
    },
    {
      nombre: 'Oro',
      puntosRequeridos: 5000,
      visitasRequeridas: 25,
      beneficio: 'Cliente VIP',
      colores: ['#FFD700', '#FFA500']
    },
    {
      nombre: 'Diamante',
      puntosRequeridos: 15000,
      visitasRequeridas: 50,
      beneficio: 'Cliente Premium',
      colores: ['#B9F2FF', '#00BFFF']
    }
  ];

  if (!tarjetasConfig?.levelsConfig) {
    return defaultNiveles;
  }

  // Transformar la configuración de la BD al formato esperado
  const configLevels = tarjetasConfig.levelsConfig;
  return [
    {
      nombre: 'Bronce',
      puntosRequeridos: configLevels.bronce?.minPoints || 0,
      visitasRequeridas: 0,
      beneficio: configLevels.bronce?.benefits?.join(', ') || 'Cliente Inicial',
      colores: ['#CD7F32', '#B8860B']
    },
    {
      nombre: 'Plata',
      puntosRequeridos: configLevels.plata?.minPoints || 1000,
      visitasRequeridas: 10,
      beneficio: configLevels.plata?.benefits?.join(', ') || 'Cliente Frecuente',
      colores: ['#C0C0C0', '#E8E8E8']
    },
    {
      nombre: 'Oro',
      puntosRequeridos: configLevels.oro?.minPoints || 5000,
      visitasRequeridas: 25,
      beneficio: configLevels.oro?.benefits?.join(', ') || 'Cliente VIP',
      colores: ['#FFD700', '#FFA500']
    },
    {
      nombre: 'Diamante',
      puntosRequeridos: configLevels.diamante?.minPoints || 15000,
      visitasRequeridas: 50,
      beneficio: configLevels.diamante?.benefits?.join(', ') || 'Cliente Premium',
      colores: ['#B9F2FF', '#00BFFF']
    }
  ];
}
