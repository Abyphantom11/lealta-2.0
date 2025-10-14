/**
 * 🧪 TEST DIRECTO DE API - Portal Config v2
 * Simula exactamente lo que debería hacer la API en producción
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// 🎯 LÓGICA DE DÍA COMERCIAL (exacta de business-day-utils.ts)
async function getCurrentBusinessDay(businessId, resetHour = 4) {
  const now = new Date();
  const currentHour = now.getHours();
  
  // Si es antes de la hora de reset (ej: 2:00 AM), seguimos en el día anterior comercial
  if (currentHour < resetHour) {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    return ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'][yesterday.getDay()];
  }
  
  // Si es después de la hora de reset, es el día comercial actual
  return ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'][now.getDay()];
}

async function testApiConfigV2() {
  console.log('🧪 TEST DIRECTO DE API CONFIG V2');
  console.log('='.repeat(40));
  
  try {
    const businessId = 'cmgf5px5f0000eyy0elci9yds';
    
    // 1. SIMULAR EXACTAMENTE LO QUE HACE LA API
    console.log('\n📡 1. SIMULANDO LÓGICA DE API');
    console.log('-'.repeat(35));
    
    // Obtener datos de BD (igual que la API)
    const [banners, promociones, recompensas, favoritos] = await Promise.all([
      prisma.portalBanner.findMany({ where: { businessId } }),
      prisma.portalPromocion.findMany({ where: { businessId } }),
      prisma.portalRecompensa.findMany({ where: { businessId } }),
      prisma.portalFavoritoDelDia.findMany({ where: { businessId } })
    ]);
    
    // Obtener día comercial actual (igual que la API)
    const currentDayName = await getCurrentBusinessDay(businessId);
    const targetDay = currentDayName; // Sin simulación
    
    console.log(`🏢 Día comercial actual: ${targetDay}`);
    console.log(`📊 Datos encontrados:`);
    console.log(`   - Banners: ${banners.length}`);
    console.log(`   - Promociones: ${promociones.length}`);
    console.log(`   - Recompensas: ${recompensas.length}`);
    console.log(`   - Favoritos: ${favoritos.length}`);
    
    // Función auxiliar (igual que la API)
    const shouldShowInDay = (item, day) => {
      return !item.dia || item.dia === day;
    };
    
    // Aplicar filtro de visibilidad por día (igual que la API)
    const bannersFiltrados = banners.filter(banner => shouldShowInDay(banner, targetDay));
    const promocionesFiltradas = promociones.filter(promo => shouldShowInDay(promo, targetDay));
    const favoritosFiltrados = favoritos.filter(fav => shouldShowInDay(fav, targetDay));
    
    console.log(`\n🔍 Después del filtro por día (${targetDay}):`);
    console.log(`   - Banners filtrados: ${bannersFiltrados.length}`);
    console.log(`   - Promociones filtradas: ${promocionesFiltradas.length}`);
    console.log(`   - Favoritos filtrados: ${favoritosFiltrados.length}`);
    
    // Filtrar solo los activos (igual que la API)
    const bannersActivos = bannersFiltrados.filter(b => b.active);
    const promocionesActivas = promocionesFiltradas.filter(p => p.active);
    const recompensasActivas = recompensas.filter(r => r.active);
    const favoritosActivos = favoritosFiltrados.filter(f => f.active);
    
    console.log(`\n✅ Después del filtro activos:`);
    console.log(`   - Banners activos: ${bannersActivos.length}`);
    console.log(`   - Promociones activas: ${promocionesActivas.length}`);
    console.log(`   - Recompensas activas: ${recompensasActivas.length}`);
    console.log(`   - Favoritos activos: ${favoritosActivos.length}`);
    
    // 2. SIMULAR RESPUESTA DE API (exacta)
    console.log('\n📤 2. RESPUESTA DE API SIMULADA');
    console.log('-'.repeat(35));
    
    const responseData = {
      nombreEmpresa: 'Mi Negocio',
      tarjetas: [],
      nivelesConfig: {},
      banners: bannersActivos.map(b => ({
        id: b.id,
        titulo: b.title,
        descripcion: b.description || '',
        imagenUrl: b.imageUrl || '',
        dia: b.dia,
        activo: b.active,
        horaPublicacion: b.publishTime || '04:00',
        orden: b.orden || 0,
        linkUrl: b.linkUrl || ''
      })),
      promociones: promocionesActivas.map(p => ({
        id: p.id,
        titulo: p.title,
        descripcion: p.description || '',
        imagenUrl: p.imageUrl || '',
        descuento: p.discount || 0,
        activo: p.active,
        dia: p.dia,
        fechaInicio: p.startDate,
        fechaFin: p.endDate,
        horaTermino: p.endTime
      })),
      recompensas: recompensasActivas.map(r => ({
        id: r.id,
        titulo: r.title,
        descripcion: r.description || '',
        puntosRequeridos: r.pointsRequired || 0,
        imagenUrl: r.imageUrl || '',
        activo: r.active,
        stock: r.stock
      })),
      favoritoDelDia: favoritosActivos.length > 0 ? {
        id: favoritosActivos[0].id,
        productName: favoritosActivos[0].productName,
        description: favoritosActivos[0].description || '',
        imageUrl: favoritosActivos[0].imageUrl || '',
        price: favoritosActivos[0].price || 0,
        originalPrice: favoritosActivos[0].originalPrice,
        discountPercentage: favoritosActivos[0].discountPercentage || 0,
        active: favoritosActivos[0].active,
        dia: favoritosActivos[0].dia
      } : null
    };
    
    // Mostrar lo que el cliente recibiría
    console.log('📋 RESPUESTA FINAL PARA EL CLIENTE:');
    console.log(`   Banners: ${responseData.banners.length}`);
    responseData.banners.forEach((banner, idx) => {
      console.log(`      ${idx + 1}. "${banner.titulo}" | IMG: ${banner.imagenUrl ? '✅' : '❌'} | Día: ${banner.dia}`);
    });
    
    console.log(`   Promociones: ${responseData.promociones.length}`);
    responseData.promociones.forEach((promo, idx) => {
      console.log(`      ${idx + 1}. "${promo.titulo}" | IMG: ${promo.imagenUrl ? '✅' : '❌'} | Día: ${promo.dia}`);
    });
    
    console.log(`   Favorito del día: ${responseData.favoritoDelDia ? 'SÍ' : 'NO'}`);
    if (responseData.favoritoDelDia) {
      console.log(`      "${responseData.favoritoDelDia.productName}" | IMG: ${responseData.favoritoDelDia.imageUrl ? '✅' : '❌'} | Día: ${responseData.favoritoDelDia.dia}`);
    }
    
    // 3. VERIFICAR SI HAY CONTENIDO PARA MOSTRAR
    console.log('\n🎯 3. ANÁLISIS FINAL');
    console.log('-'.repeat(25));
    
    const hasVisibleContent = responseData.banners.length > 0 || 
                             responseData.promociones.length > 0 || 
                             responseData.favoritoDelDia !== null;
    
    if (hasVisibleContent) {
      console.log('✅ LA API DEBERÍA DEVOLVER CONTENIDO VISIBLE');
      console.log('🔍 Si no se muestra en producción, el problema es:');
      console.log('   1. 🌐 Cache en producción');
      console.log('   2. 🖼️ URLs de imágenes no accesibles');
      console.log('   3. 🔄 Frontend no procesando respuesta correctamente');
      console.log('   4. ❌ Errores en la consola del navegador');
    } else {
      console.log('❌ LA API NO DEVOLVERÍA CONTENIDO');
      console.log('🛠️ Necesitas crear contenido con imágenes para el día actual');
    }
    
  } catch (error) {
    console.error('❌ Error en test de API:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testApiConfigV2().catch(console.error);
