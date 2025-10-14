// Auditoría completa de Business Isolation - Detectar filtraciones de datos entre negocios
const { PrismaClient } = require('@prisma/client');

async function auditBusinessIsolation() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔒 AUDITORÍA DE BUSINESS ISOLATION');
    console.log('='.repeat(60));
    
    // IDs de los dos negocios en cuestión
    const casaSaborId = 'cmgf5px5f0000eyy0elci9yds'; // Casa del Sabor Demo
    const loveMeSkyId = 'cmgh621rd0012lb0aixrzpvrw'; // Love Me Sky (usuario real)
    
    console.log(`🏢 Casa del Sabor Demo: ${casaSaborId}`);
    console.log(`🏢 Love Me Sky (REAL): ${loveMeSkyId}`);
    
    // 1. VERIFICAR DATOS DEL PORTAL
    console.log('\n🔍 1. AUDITORÍA DE DATOS DEL PORTAL');
    console.log('-'.repeat(40));
    
    // Banners
    const bannersCasaSabor = await prisma.portalBanner.findMany({
      where: { businessId: casaSaborId },
      select: { id: true, title: true, businessId: true, createdAt: true }
    });
    
    const bannersLoveMeSky = await prisma.portalBanner.findMany({
      where: { businessId: loveMeSkyId },
      select: { id: true, title: true, businessId: true, createdAt: true }
    });
    
    console.log(`📊 Banners Casa del Sabor: ${bannersCasaSabor.length}`);
    bannersCasaSabor.forEach(banner => {
      console.log(`   - "${banner.title}" | BusinessId: ${banner.businessId}`);
    });
    
    console.log(`📊 Banners Love Me Sky: ${bannersLoveMeSky.length}`);
    bannersLoveMeSky.forEach(banner => {
      console.log(`   - "${banner.title}" | BusinessId: ${banner.businessId}`);
    });
    
    // Promociones
    const promocionesCasaSabor = await prisma.portalPromocion.findMany({
      where: { businessId: casaSaborId },
      select: { id: true, title: true, businessId: true, createdAt: true }
    });
    
    const promocionesLoveMeSky = await prisma.portalPromocion.findMany({
      where: { businessId: loveMeSkyId },
      select: { id: true, title: true, businessId: true, createdAt: true }
    });
    
    console.log(`📊 Promociones Casa del Sabor: ${promocionesCasaSabor.length}`);
    promocionesCasaSabor.forEach(promo => {
      console.log(`   - "${promo.title}" | BusinessId: ${promo.businessId}`);
    });
    
    console.log(`📊 Promociones Love Me Sky: ${promocionesLoveMeSky.length}`);
    promocionesLoveMeSky.forEach(promo => {
      console.log(`   - "${promo.title}" | BusinessId: ${promo.businessId}`);
    });
    
    // 2. VERIFICAR CLIENTES
    console.log('\n🔍 2. AUDITORÍA DE CLIENTES');
    console.log('-'.repeat(40));
    
    const clientesCasaSabor = await prisma.cliente.count({
      where: { businessId: casaSaborId }
    });
    
    const clientesLoveMeSky = await prisma.cliente.count({
      where: { businessId: loveMeSkyId }
    });
    
    console.log(`👥 Clientes Casa del Sabor: ${clientesCasaSabor}`);
    console.log(`👥 Clientes Love Me Sky: ${clientesLoveMeSky}`);
    
    // Verificar si hay clientes compartidos (PROBLEMA GRAVE)
    const clientesCompartidos = await prisma.$queryRaw`
      SELECT c1.cedula, c1.nombre,
             c1."businessId" as business1,
             c2."businessId" as business2
      FROM "Cliente" c1
      JOIN "Cliente" c2 ON c1.cedula = c2.cedula 
      WHERE c1."businessId" = ${casaSaborId}
        AND c2."businessId" = ${loveMeSkyId}
    `;
    
    if (clientesCompartidos.length > 0) {
      console.log('🚨 ALERTA: CLIENTES COMPARTIDOS DETECTADOS');
      clientesCompartidos.forEach(cliente => {
        console.log(`   ⚠️ "${cliente.nombre}" (${cliente.cedula}) existe en ambos negocios`);
      });
    } else {
      console.log('✅ No hay clientes compartidos entre negocios');
    }
    
    // 3. VERIFICAR CONSUMOS
    console.log('\n🔍 3. AUDITORÍA DE CONSUMOS');
    console.log('-'.repeat(40));
    
    const consumosCasaSabor = await prisma.consumo.count({
      where: { businessId: casaSaborId }
    });
    
    const consumosLoveMeSky = await prisma.consumo.count({
      where: { businessId: loveMeSkyId }
    });
    
    console.log(`🛒 Consumos Casa del Sabor: ${consumosCasaSabor}`);
    console.log(`🛒 Consumos Love Me Sky: ${consumosLoveMeSky}`);
    
    // 4. VERIFICAR VISITAS
    console.log('\n🔍 4. AUDITORÍA DE VISITAS');
    console.log('-'.repeat(40));
    
    const visitasCasaSabor = await prisma.visita.count({
      where: { businessId: casaSaborId }
    });
    
    const visitasLoveMeSky = await prisma.visita.count({
      where: { businessId: loveMeSkyId }
    });
    
    console.log(`🚶 Visitas Casa del Sabor: ${visitasCasaSabor}`);
    console.log(`🚶 Visitas Love Me Sky: ${visitasLoveMeSky}`);
    
    // 5. VERIFICAR CONFIGURACIONES
    console.log('\n🔍 5. AUDITORÍA DE CONFIGURACIONES');
    console.log('-'.repeat(40));
    
    // Configuraciones de puntos
    const puntosConfigCasaSabor = await prisma.puntosConfig.findMany({
      where: { businessId: casaSaborId },
      select: { businessId: true, puntosPorDolar: true, bonusPorRegistro: true }
    });
    
    const puntosConfigLoveMeSky = await prisma.puntosConfig.findMany({
      where: { businessId: loveMeSkyId },
      select: { businessId: true, puntosPorDolar: true, bonusPorRegistro: true }
    });
    
    console.log(`⚙️ Config Puntos Casa del Sabor: ${puntosConfigCasaSabor.length}`);
    console.log(`⚙️ Config Puntos Love Me Sky: ${puntosConfigLoveMeSky.length}`);
    
    // 6. BUSCAR DATOS HUÉRFANOS (SIN BUSINESS ID)
    console.log('\n🔍 6. AUDITORÍA DE DATOS HUÉRFANOS');
    console.log('-'.repeat(40));
    
    const bannersHuerfanos = await prisma.portalBanner.count({
      where: { businessId: null }
    });
    
    const promocionesHuerfanas = await prisma.portalPromocion.count({
      where: { businessId: null }
    });
    
    const clientesHuerfanos = await prisma.cliente.count({
      where: { businessId: null }
    });
    
    console.log(`🔍 Banners huérfanos (sin businessId): ${bannersHuerfanos}`);
    console.log(`🔍 Promociones huérfanas (sin businessId): ${promocionesHuerfanas}`);
    console.log(`🔍 Clientes huérfanos (sin businessId): ${clientesHuerfanos}`);
    
    // 7. VERIFICAR CROSS-CONTAMINATION EN ÚLTIMAS MIGRACIONES
    console.log('\n🔍 7. AUDITORÍA DE MIGRACIONES RECIENTES');
    console.log('-'.repeat(40));
    
    // Buscar datos creados recientemente que podrían estar mal asignados
    const bannersRecientes = await prisma.portalBanner.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Últimas 24 horas
        }
      },
      select: { id: true, title: true, businessId: true, createdAt: true },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`📅 Banners creados en las últimas 24h: ${bannersRecientes.length}`);
    bannersRecientes.forEach(banner => {
      const business = banner.businessId === casaSaborId ? 'Casa del Sabor' : 
                     banner.businessId === loveMeSkyId ? 'Love Me Sky' : 'OTRO';
      console.log(`   - "${banner.title}" → ${business} (${banner.createdAt})`);
    });
    
    // 8. RESUMEN DE SEGURIDAD
    console.log('\n🛡️ RESUMEN DE SEGURIDAD');
    console.log('='.repeat(60));
    
    const problemas = [];
    
    if (clientesCompartidos.length > 0) {
      problemas.push(`🚨 ${clientesCompartidos.length} clientes compartidos entre negocios`);
    }
    
    if (bannersHuerfanos > 0 || promocionesHuerfanas > 0 || clientesHuerfanos > 0) {
      problemas.push(`⚠️ Datos huérfanos sin businessId detectados`);
    }
    
    if (problemas.length === 0) {
      console.log('✅ BUSINESS ISOLATION CORRECTO');
      console.log('   - No hay filtración de datos entre negocios');
      console.log('   - Cada negocio tiene sus datos aislados');
      console.log('   - No hay datos huérfanos');
    } else {
      console.log('🚨 PROBLEMAS DE SEGURIDAD DETECTADOS:');
      problemas.forEach(problema => console.log(`   ${problema}`));
    }
    
    console.log('\n📊 ESTADÍSTICAS FINALES:');
    console.log(`   Casa del Sabor Demo: ${bannersCasaSabor.length} banners, ${promocionesCasaSabor.length} promociones, ${clientesCasaSabor} clientes`);
    console.log(`   Love Me Sky: ${bannersLoveMeSky.length} banners, ${promocionesLoveMeSky.length} promociones, ${clientesLoveMeSky} clientes`);
    
  } catch (error) {
    console.error('❌ Error en auditoría:', error);
  } finally {
    await prisma.$disconnect();
  }
}

auditBusinessIsolation().catch(console.error);
