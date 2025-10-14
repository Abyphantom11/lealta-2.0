const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verificarDatosEspecificos() {
  try {
    const businessId = 'cmgf5px5f0000eyy0elci9yds'; // casa-sabor-demo
    
    console.log('🔍 VERIFICANDO DATOS ESPECÍFICOS PARA casa-sabor-demo:');
    console.log('=================================================');
    
    // Banners
    const banners = await prisma.portalBanner.findMany({
      where: { businessId },
      select: {
        id: true,
        title: true,
        dia: true,
        active: true,
        imageUrl: true,
        orden: true
      }
    });
    
    console.log(`\n📢 BANNERS (${banners.length} encontrados):`);
    banners.forEach(b => {
      console.log(`  - "${b.title}" | Día: ${b.dia} | Activo: ${b.active} | Imagen: ${b.imageUrl ? '✅' : '❌'} | Orden: ${b.orden}`);
    });
    
    // Promociones
    const promociones = await prisma.portalPromocion.findMany({
      where: { businessId },
      select: {
        id: true,
        title: true,
        dia: true,
        active: true,
        imageUrl: true,
        discount: true,
        orden: true
      }
    });
    
    console.log(`\n🎁 PROMOCIONES (${promociones.length} encontradas):`);
    promociones.forEach(p => {
      console.log(`  - "${p.title}" | Día: ${p.dia} | Activo: ${p.active} | Descuento: ${p.discount} | Imagen: ${p.imageUrl ? '✅' : '❌'} | Orden: ${p.orden}`);
    });
    
    // Favoritos
    const favoritos = await prisma.portalFavoritoDelDia.findMany({
      where: { businessId },
      select: {
        id: true,
        productName: true,
        dia: true,
        active: true,
        imageUrl: true,
        description: true
      }
    });
    
    console.log(`\n⭐ FAVORITOS DEL DÍA (${favoritos.length} encontrados):`);
    favoritos.forEach(f => {
      console.log(`  - "${f.productName}" | Día: ${f.dia} | Activo: ${f.active} | Imagen: ${f.imageUrl ? '✅' : '❌'}`);
    });
    
    // Día comercial actual
    const now = new Date();
    const hour = now.getHours();
    const dayNames = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
    
    let businessDay;
    if (hour < 4) {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      businessDay = dayNames[yesterday.getDay()];
    } else {
      businessDay = dayNames[now.getDay()];
    }
    
    console.log(`\n🗓️ DÍA COMERCIAL ACTUAL: ${businessDay}`);
    console.log(`⏰ Hora actual: ${hour}:${now.getMinutes().toString().padStart(2, '0')}`);
    
    // Filtrar por día comercial actual
    const bannersHoy = banners.filter(b => b.active && (!b.dia || b.dia === businessDay));
    const promocionesHoy = promociones.filter(p => p.active && (!p.dia || p.dia === businessDay));
    const favoritosHoy = favoritos.filter(f => f.active && (!f.dia || f.dia === businessDay));
    
    console.log(`\n🎯 ELEMENTOS PARA HOY (${businessDay}):`);
    console.log(`📢 Banners activos: ${bannersHoy.length}`);
    bannersHoy.forEach(b => console.log(`   - ${b.title}`));
    
    console.log(`🎁 Promociones activas: ${promocionesHoy.length}`);
    promocionesHoy.forEach(p => console.log(`   - ${p.title}`));
    
    console.log(`⭐ Favoritos activos: ${favoritosHoy.length}`);
    favoritosHoy.forEach(f => console.log(`   - ${f.productName}`));
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verificarDatosEspecificos();
