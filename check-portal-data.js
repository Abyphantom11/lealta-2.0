const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkCurrentPortalData() {
  try {
    const businessId = 'cmfqhepmq0000ey4slyms4knv';
    
    console.log('🔍 Verificando datos actuales del portal para business:', businessId);
    
    // Obtener todos los datos del portal
    const banners = await prisma.portalBanner.findMany({
      where: { businessId },
      orderBy: { orden: 'asc' }
    });
    
    const promociones = await prisma.portalPromocion.findMany({
      where: { businessId },
      orderBy: { orden: 'asc' }
    });
    
    const recompensas = await prisma.portalRecompensa.findMany({
      where: { businessId },
      orderBy: { orden: 'asc' }
    });
    
    const favoritos = await prisma.portalFavoritoDelDia.findMany({
      where: { businessId },
      orderBy: { date: 'desc' }
    });
    
    console.log('\n🎨 BANNERS:');
    banners.forEach((item, i) => {
      console.log(`  ${i+1}. ${item.title} (activo: ${item.active})`);
      console.log(`     URL: ${item.imageUrl}`);
      console.log(`     Descripción: ${item.description}`);
    });
    
    console.log('\n🔥 PROMOCIONES:');
    promociones.forEach((item, i) => {
      console.log(`  ${i+1}. ${item.title} (activo: ${item.active})`);
      console.log(`     URL: ${item.imageUrl}`);
      console.log(`     Descripción: ${item.description}`);
      console.log(`     Descuento: ${item.discount}`);
    });
    
    console.log('\n🎁 RECOMPENSAS:');
    recompensas.forEach((item, i) => {
      console.log(`  ${i+1}. ${item.title} (activo: ${item.active})`);
      console.log(`     URL: ${item.imageUrl}`);
      console.log(`     Descripción: ${item.description}`);
      console.log(`     Puntos: ${item.pointsCost}`);
    });
    
    console.log('\n⭐ FAVORITOS DEL DÍA:');
    favoritos.forEach((item, i) => {
      console.log(`  ${i+1}. ${item.productName} (activo: ${item.active})`);
      console.log(`     URL: ${item.imageUrl}`);
      console.log(`     Descripción: ${item.description}`);
      console.log(`     Precio especial: ${item.specialPrice}`);
    });
    
    // Simular la respuesta de la API v2
    console.log('\n📋 SIMULANDO RESPUESTA API V2:');
    
    const apiResponse = {
      banners: banners.map(b => ({
        id: b.id,
        titulo: b.title,        // Campo español
        title: b.title,         // Campo inglés
        imagenUrl: b.imageUrl,  // Campo español
        imageUrl: b.imageUrl,   // Campo inglés
        activo: b.active,       // Campo español
        isActive: b.active,     // Campo inglés
        descripcion: b.description,
        description: b.description
      })),
      promociones: promociones.map(p => ({
        id: p.id,
        titulo: p.title,
        title: p.title,
        imagenUrl: p.imageUrl,
        imageUrl: p.imageUrl,
        activo: p.active,
        isActive: p.active,
        descripcion: p.description,
        description: p.description,
        descuento: p.discount
      })),
      recompensas: recompensas.map(r => ({
        id: r.id,
        titulo: r.title,
        title: r.title,
        imagenUrl: r.imageUrl,
        imageUrl: r.imageUrl,
        activo: r.active,
        isActive: r.active,
        descripcion: r.description,
        description: r.description,
        puntosRequeridos: r.pointsCost,
        pointsCost: r.pointsCost
      })),
      favoritoDelDia: favoritos.map(f => ({
        id: f.id,
        titulo: f.productName,
        title: f.productName,
        imagenUrl: f.imageUrl,
        imageUrl: f.imageUrl,
        activo: f.active,
        isActive: f.active,
        descripcion: f.description,
        description: f.description,
        precioEspecial: f.specialPrice
      }))
    };
    
    console.log('\nRespuesta API (resumida):');
    console.log(`  - Banners: ${apiResponse.banners.length}`);
    console.log(`  - Promociones: ${apiResponse.promociones.length}`);
    console.log(`  - Recompensas: ${apiResponse.recompensas.length}`);
    console.log(`  - Favoritos: ${apiResponse.favoritoDelDia.length}`);
    
    if (apiResponse.recompensas.length > 0) {
      console.log('\nRecompensas en respuesta API:');
      apiResponse.recompensas.forEach(r => {
        console.log(`  - ${r.titulo} (${r.puntosRequeridos} pts, activo: ${r.activo})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error verificando datos del portal:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCurrentPortalData();
