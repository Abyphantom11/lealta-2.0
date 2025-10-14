import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getBusinessIdFromRequest } from '@/lib/business-utils';
import { getCurrentBusinessDay } from '@/lib/business-day-utils';

const prisma = new PrismaClient();

// Configurar como ruta dinámica
export const dynamic = 'force-dynamic';

/**
 * API v2 para obtener configuración del portal desde PostgreSQL
 * Sincroniza automáticamente las ediciones del admin con el cliente
 */
export async function GET(request: NextRequest) {
  try {
    // 🔥 CRÍTICO: Usar exactamente el mismo patrón que branding (que funciona)
    const queryBusinessId = request.nextUrl.searchParams.get('businessId');
    const headerBusinessId = getBusinessIdFromRequest(request);
    
    let businessId = queryBusinessId || headerBusinessId;
    businessId = businessId || 'default';
    
    const simulateDay = request.nextUrl.searchParams.get('simulateDay');
    
    // Obtener datos desde PostgreSQL
    const [banners, promociones, recompensas, favoritos, portalConfig] = await Promise.all([
      prisma.portalBanner.findMany({
        where: { businessId },
        orderBy: { orden: 'asc' }
      }),
      prisma.portalPromocion.findMany({
        where: { businessId },
        orderBy: { orden: 'asc' }
      }),
      prisma.portalRecompensa.findMany({
        where: { businessId },
        orderBy: { orden: 'asc' }
      }),
      prisma.portalFavoritoDelDia.findMany({
        where: { businessId },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.portalConfig.findUnique({
        where: { businessId }
      })
    ]);

    // 🎯 Filtrar por día de negocio actual (usa lógica unificada de business-day-utils)
    const currentDayName = await getCurrentBusinessDay(businessId);
    const targetDay = simulateDay || currentDayName;
    
    // Función auxiliar para verificar si un elemento debe mostrarse en el día actual
    const shouldShowInDay = (item: { dia: string | null }, day: string): boolean => {
      return !item.dia || item.dia === day;
    };
    
    // Aplicar filtro de visibilidad por día
    const bannersFiltrados = banners.filter(banner => shouldShowInDay(banner, targetDay));
    const promocionesFiltradas = promociones.filter(promo => shouldShowInDay(promo, targetDay));
    const favoritosFiltrados = favoritos.filter(fav => shouldShowInDay(fav, targetDay));

    // Filtrar solo los activos para el cliente
    const bannersActivos = bannersFiltrados.filter(b => b.active);
    const promocionesActivas = promocionesFiltradas.filter(p => p.active);
    const recompensasActivas = recompensas.filter(r => r.active);
    const favoritosActivos = favoritosFiltrados.filter(f => f.active);

    // Convertir a formato compatible con el cliente
    const responseData = {
      nombreEmpresa: 'Mi Negocio', // Por ahora hardcoded, se puede obtener del business table
      tarjetas: [], // Por ahora vacío, se puede agregar lógica de tarjetas después
      nivelesConfig: {},
      banners: bannersActivos.map(b => ({
        id: b.id,
        titulo: b.title,
        descripcion: b.description || '',
        imagenUrl: b.imageUrl || '',
        dia: b.dia,
        activo: b.active,
        orden: b.orden
      })),
      promociones: promocionesActivas.map(p => ({
        id: p.id,
        titulo: p.title,
        descripcion: p.description || '',
        descuento: parseInt(p.discount?.replace('%', '') || '0') || 0,
        imagenUrl: p.imageUrl || '',
        dia: p.dia,
        activo: p.active,
        orden: p.orden,
        validUntil: p.validUntil
      })),
      recompensas: recompensasActivas.map(r => ({
        id: r.id,
        nombre: r.title,
        titulo: r.title,
        descripcion: r.description || '',
        puntosRequeridos: r.pointsCost,
        puntosNecesarios: r.pointsCost,
        imagenUrl: r.imageUrl || '',
        activo: r.active,
        stock: r.stock || 0
      })),
      favoritoDelDia: favoritosActivos.length > 0 ? favoritosActivos[0] : null,
      sectionTitles: {
        banners: 'Ofertas Especiales',
        promociones: portalConfig?.promocionesTitle || 'Promociones',
        recompensas: portalConfig?.recompensasTitle || 'Recompensas',
        tarjetas: 'Beneficios'
      },
      // Metadatos útiles
      lastUpdated: new Date().toISOString(),
      source: 'postgresql-v2',
      businessId: businessId,
      itemCounts: {
        banners: bannersActivos.length,
        promociones: promocionesActivas.length,
        recompensas: recompensasActivas.length,
        favoritos: favoritosActivos.length
      }
    };

    return NextResponse.json({
      success: true,
      data: responseData
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '-1',
        'Surrogate-Control': 'no-store',
        'Vary': '*'
      }
    });

  } catch (error) {
    console.error('❌ Error in portal config v2 (PostgreSQL):', error);
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
          favoritoDelDia: null,
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
