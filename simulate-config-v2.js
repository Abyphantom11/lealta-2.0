#!/usr/bin/env node

/**
 * 🔍 SIMULAR: Exactamente la lógica de config-v2 paso a paso
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const BUSINESS_ID = 'cmgf5px5f0000eyy0elci9yds';

async function simulateConfigV2() {
  console.log('🔍 SIMULANDO CONFIG-V2 PASO A PASO');
  console.log('='.repeat(50));
  
  try {
    // PASO 1: Obtener datos raw de BD (igual que config-v2)
    console.log('\n📊 PASO 1: DATOS RAW DE BD');
    console.log('-'.repeat(30));
    
    const [banners, promociones, recompensas, favoritos, portalConfig] = await Promise.all([
      prisma.portalBanner.findMany({
        where: { businessId: BUSINESS_ID },
        orderBy: { orden: 'asc' }
      }),
      prisma.portalPromocion.findMany({
        where: { businessId: BUSINESS_ID },
        orderBy: { orden: 'asc' }
      }),
      prisma.portalRecompensa.findMany({
        where: { businessId: BUSINESS_ID },
        orderBy: { orden: 'asc' }
      }),
      prisma.portalFavoritoDelDia.findMany({
        where: { businessId: BUSINESS_ID },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.portalConfig.findUnique({
        where: { businessId: BUSINESS_ID }
      })
    ]);
    
    console.log(`Banners encontrados: ${banners.length}`);
    console.log(`Promociones encontradas: ${promociones.length}`);
    console.log(`Favoritos encontrados: ${favoritos.length}`);
    console.log(`Recompensas encontradas: ${recompensas.length}`);
    
    // PASO 2: Día comercial (simulando getCurrentBusinessDay)
    console.log('\n📅 PASO 2: CALCULAR DÍA COMERCIAL');
    console.log('-'.repeat(30));
    
    const now = new Date();
    let currentDayName;
    
    if (now.getHours() < 4) {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      currentDayName = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'][yesterday.getDay()];
    } else {
      currentDayName = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'][now.getDay()];
    }
    
    console.log(`Día comercial calculado: "${currentDayName}"`);
    
    // PASO 3: Filtrar por día (igual que config-v2)
    console.log('\n🔍 PASO 3: FILTRAR POR DÍA');
    console.log('-'.repeat(30));
    
    const shouldShowInDay = (item, day) => {
      const result = !item.dia || item.dia === day;
      console.log(`   Elemento "${item.title || item.productName}" con día "${item.dia}" → ${result ? 'VISIBLE' : 'OCULTO'}`);
      return result;
    };
    
    const bannersFiltrados = banners.filter(banner => shouldShowInDay(banner, currentDayName));
    const promocionesFiltradas = promociones.filter(promo => shouldShowInDay(promo, currentDayName));
    const favoritosFiltrados = favoritos.filter(fav => shouldShowInDay(fav, currentDayName));
    
    console.log(`Banners después de filtro día: ${bannersFiltrados.length}/${banners.length}`);
    console.log(`Promociones después de filtro día: ${promocionesFiltradas.length}/${promociones.length}`);
    console.log(`Favoritos después de filtro día: ${favoritosFiltrados.length}/${favoritos.length}`);
    
    // PASO 4: Filtrar activos (igual que config-v2)
    console.log('\n✅ PASO 4: FILTRAR ACTIVOS');
    console.log('-'.repeat(30));
    
    const bannersActivos = bannersFiltrados.filter(b => {
      console.log(`   Banner "${b.title}" active: ${b.active} → ${b.active ? 'INCLUIDO' : 'EXCLUIDO'}`);
      return b.active;
    });
    
    const promocionesActivas = promocionesFiltradas.filter(p => {
      console.log(`   Promoción "${p.title}" active: ${p.active} → ${p.active ? 'INCLUIDO' : 'EXCLUIDO'}`);
      return p.active;
    });
    
    const favoritosActivos = favoritosFiltrados.filter(f => {
      console.log(`   Favorito "${f.productName}" active: ${f.active} → ${f.active ? 'INCLUIDO' : 'EXCLUIDO'}`);
      return f.active;
    });
    
    console.log(`Banners finales: ${bannersActivos.length}`);
    console.log(`Promociones finales: ${promocionesActivas.length}`);
    console.log(`Favoritos finales: ${favoritosActivos.length}`);
    
    // PASO 5: Resultado final
    console.log('\n🎯 PASO 5: RESULTADO FINAL');
    console.log('-'.repeat(30));
    
    if (bannersActivos.length === 0 && promocionesActivas.length === 0 && favoritosActivos.length === 0) {
      console.log('❌ TODOS LOS ARRAYS VACÍOS - Aquí está el problema');
    } else {
      console.log('✅ HAY ELEMENTOS - El problema debe estar después');
    }
    
  } catch (error) {
    console.error('❌ Error en simulación:', error);
  } finally {
    await prisma.$disconnect();
  }
}

simulateConfigV2().catch(console.error);
