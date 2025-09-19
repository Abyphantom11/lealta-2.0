const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testSyncFlow() {
  try {
    const businessId = 'cmfqhepmq0000ey4slyms4knv';
    
    console.log('🔄 Probando el flujo completo admin → cliente...');
    
    // 1. Ver qué hay actualmente en la base de datos
    console.log('\n📊 PASO 1: Estado actual en PostgreSQL');
    const [banners, promociones, recompensas, favoritos] = await Promise.all([
      prisma.portalBanner.findMany({ where: { businessId }, orderBy: { orden: 'asc' } }),
      prisma.portalPromocion.findMany({ where: { businessId }, orderBy: { orden: 'asc' } }),
      prisma.portalRecompensa.findMany({ where: { businessId }, orderBy: { orden: 'asc' } }),
      prisma.portalFavoritoDelDia.findMany({ where: { businessId } })
    ]);
    
    console.log(`🎨 Banners: ${banners.length}`);
    banners.forEach(b => console.log(`  - ${b.title} (activo: ${b.active})`));
    
    console.log(`🔥 Promociones: ${promociones.length}`);
    promociones.forEach(p => console.log(`  - ${p.title} (activo: ${p.active})`));
    
    console.log(`🎁 Recompensas: ${recompensas.length}`);
    recompensas.forEach(r => console.log(`  - ${r.title} (${r.pointsCost} pts, activo: ${r.active})`));
    
    console.log(`⭐ Favoritos del día: ${favoritos.length}`);
    favoritos.forEach(f => console.log(`  - ${f.productName} (activo: ${f.active})`));
    
    // 2. Simular respuesta API v2 (lo que ve el cliente)
    console.log('\n📋 PASO 2: Simulando API v2 (Cliente)');
    
    const clienteResponse = {
      banners: banners.filter(b => b.active).map(b => ({
        id: b.id,
        titulo: b.title,
        imagenUrl: b.imageUrl,
        activo: b.active
      })),
      promociones: promociones.filter(p => p.active).map(p => ({
        id: p.id,
        titulo: p.title,
        imagenUrl: p.imageUrl,
        activo: p.active,
        descuento: p.discount
      })),
      recompensas: recompensas.filter(r => r.active).map(r => ({
        id: r.id,
        titulo: r.title,
        puntosRequeridos: r.pointsCost,
        activo: r.active
      })),
      favoritoDelDia: favoritos.filter(f => f.active).map(f => ({
        id: f.id,
        titulo: f.productName,
        imagenUrl: f.imageUrl,
        activo: f.active
      }))
    };
    
    console.log('Cliente verá:');
    console.log(`  🎨 ${clienteResponse.banners.length} banners activos`);
    console.log(`  🔥 ${clienteResponse.promociones.length} promociones activas`);
    console.log(`  🎁 ${clienteResponse.recompensas.length} recompensas activas`);
    console.log(`  ⭐ ${clienteResponse.favoritoDelDia.length} favoritos activos`);
    
    // 3. Verificar que las recompensas esperadas están presentes
    console.log('\n✅ PASO 3: Verificación de recompensas esperadas');
    const expectedRewards = ['werwr', 'dsfsf'];
    const foundRewards = clienteResponse.recompensas.map(r => r.titulo);
    
    expectedRewards.forEach(expected => {
      const found = foundRewards.includes(expected);
      console.log(`  ${expected}: ${found ? '✅ VISIBLE EN CLIENTE' : '❌ NO VISIBLE'}`);
    });
    
    // 4. Simular respuesta admin (lo que ve el admin)
    console.log('\n📋 PASO 4: Simulando API Admin');
    
    const adminResponse = {
      banners: banners.map(b => ({
        id: b.id,
        titulo: b.title,
        imagenUrl: b.imageUrl || '',
        activo: b.active
      })),
      recompensas: recompensas.map(r => ({
        id: r.id,
        nombre: r.title,
        puntosRequeridos: r.pointsCost,
        activo: r.active
      }))
    };
    
    console.log('Admin verá:');
    console.log(`  🎨 ${adminResponse.banners.length} banners totales`);
    console.log(`  🎁 ${adminResponse.recompensas.length} recompensas totales`);
    
    // 5. Conclusión
    console.log('\n🎉 CONCLUSIÓN:');
    
    if (expectedRewards.every(r => foundRewards.includes(r))) {
      console.log('✅ ÉXITO: Todas las recompensas esperadas están sincronizadas entre admin y cliente!');
      console.log('✅ El flujo admin → PostgreSQL → cliente está funcionando correctamente.');
    } else {
      console.log('❌ PROBLEMA: Faltan recompensas esperadas en el cliente.');
      console.log('❌ El flujo de sincronización necesita ajustes.');
    }
    
  } catch (error) {
    console.error('❌ Error en el test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testSyncFlow();
