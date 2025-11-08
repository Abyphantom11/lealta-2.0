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
    
    // 🔍 DEBUG: Log detallado para diagnosticar
    console.log('🔍 [CONFIG-V2] Debug info:', {
      businessId,
      currentDayName,
      targetDay,
      bannersRaw: banners.length,
      promocionesRaw: promociones.length,
      favoritosRaw: favoritos.length,
      bannersDias: banners.map(b => ({ title: b.title, dia: b.dia, active: b.active })),
      promocionesDias: promociones.map(p => ({ title: p.title, dia: p.dia, active: p.active })),
      favoritosDias: favoritos.map(f => ({ name: f.productName, dia: f.dia, active: f.active }))
    });
    
    // Función auxiliar mejorada para verificar si un elemento debe mostrarse en el día actual
    const shouldShowInDay = (item: { dia: string | null }, day: string): boolean => {
      // Si no tiene día definido o es null, siempre mostrar
      if (!item.dia) {
        console.log(`   shouldShowInDay: dia=null => true (sin restricción)`);
        return true;
      }
      
      // Normalizar a minúsculas para comparación
      const diaItem = item.dia.toLowerCase().trim();
      const dayNormalizado = day.toLowerCase().trim();
      
      // Caso 1: "Todos los días" o contiene "todos"
      if (diaItem.includes('todos')) {
        console.log(`   shouldShowInDay: dia="${item.dia}" => true (todos los días)`);
        return true;
      }
      
      // Caso 2: Múltiples días separados por comas
      if (diaItem.includes(',')) {
        const dias = diaItem.split(',').map(d => d.trim());
        const result = dias.includes(dayNormalizado);
        console.log(`   shouldShowInDay: dia="${item.dia}" vs day="${day}" => ${result} (lista: ${dias.join(', ')})`);
        return result;
      }
      
      // Caso 3: Día específico exacto
      const result = diaItem === dayNormalizado;
      console.log(`   shouldShowInDay: dia="${item.dia}" vs day="${day}" => ${result} (exacto)`);
      return result;
    };
    
    // Aplicar filtro de visibilidad por día
    console.log('🔍 [CONFIG-V2] Filtrando por día...');
    const bannersFiltrados = banners.filter(banner => shouldShowInDay(banner, targetDay));
    const promocionesFiltradas = promociones.filter(promo => shouldShowInDay(promo, targetDay));
    const favoritosFiltrados = favoritos.filter(fav => shouldShowInDay(fav, targetDay));
    
    console.log('🔍 [CONFIG-V2] Después de filtrar por día:', {
      bannersFiltrados: bannersFiltrados.length,
      promocionesFiltradas: promocionesFiltradas.length,
      favoritosFiltrados: favoritosFiltrados.length
    });

    // Filtrar solo los activos para el cliente
    const bannersActivos = bannersFiltrados.filter(b => b.active);
    const promocionesActivas = promocionesFiltradas.filter(p => p.active);
    const recompensasActivas = recompensas.filter(r => r.active);
    const favoritosActivos = favoritosFiltrados.filter(f => f.active);
    
    console.log('🔍 [CONFIG-V2] Después de filtrar por activo:', {
      bannersActivos: bannersActivos.length,
      promocionesActivas: promocionesActivas.length,
      favoritosActivos: favoritosActivos.length
    });

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
        descuento: Number.parseInt(p.discount?.replace('%', '') || '0') || 0,
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
      favoritoDelDia: favoritosActivos.length > 0 ? {
        id: favoritosActivos[0].id,
        productName: favoritosActivos[0].productName,
        description: favoritosActivos[0].description || '',
        imageUrl: favoritosActivos[0].imageUrl || '',
        originalPrice: favoritosActivos[0].originalPrice,
        specialPrice: favoritosActivos[0].specialPrice,
        specialOffer: favoritosActivos[0].specialOffer,
        dia: favoritosActivos[0].dia,
        activo: favoritosActivos[0].active
      } : null,
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
