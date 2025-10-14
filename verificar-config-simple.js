/**
 * Script simplificado para diagnosticar la configuración del portal
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verificarConfiguracion() {
  console.log('🔍 VERIFICACIÓN RÁPIDA: Portal del Cliente');
  console.log('==========================================');

  try {
    // Verificar si existen las tablas necesarias
    console.log('\n📋 VERIFICANDO ESTRUCTURA DE BASE DE DATOS:');
    
    const tablas = [
      { nombre: 'Business', query: () => prisma.business.findMany({ take: 3 }) },
      { nombre: 'Banner', query: () => prisma.$queryRaw`SELECT COUNT(*) as count FROM "Banner" LIMIT 1` },
      { nombre: 'Promocion', query: () => prisma.$queryRaw`SELECT COUNT(*) as count FROM "Promocion" LIMIT 1` },
      { nombre: 'FavoritoDelDia', query: () => prisma.$queryRaw`SELECT COUNT(*) as count FROM "FavoritoDelDia" LIMIT 1` }
    ];

    for (const tabla of tablas) {
      try {
        const resultado = await tabla.query();
        if (tabla.nombre === 'Business') {
          console.log(`✅ ${tabla.nombre}: ${resultado.length} registros encontrados`);
          resultado.forEach(b => console.log(`   - ${b.name} (${b.slug}) - Activo: ${b.isActive}`));
        } else {
          console.log(`✅ ${tabla.nombre}: ${resultado[0].count} registros`);
        }
      } catch (error) {
        console.log(`❌ ${tabla.nombre}: Error - ${error.message}`);
      }
    }

    // Verificar datos específicos para casa-sabor-demo
    console.log('\n🎯 VERIFICANDO DATOS PARA casa-sabor-demo:');
    
    const businessId = 'cmgf5px5f0000eyy0elci9yds'; // casa-sabor-demo
    
    try {
      const business = await prisma.business.findUnique({
        where: { id: businessId },
        select: { name: true, slug: true, isActive: true }
      });
      
      if (!business) {
        console.log('❌ Negocio casa-sabor-demo no encontrado');
        return;
      }
      
      console.log(`📊 Negocio: ${business.name} - Activo: ${business.isActive}`);
      
      // Query directa para evitar errores
      const bannersQuery = await prisma.$queryRaw`
        SELECT COUNT(*) as total, 
               COUNT(CASE WHEN activo = true THEN 1 END) as activos
        FROM "Banner" 
        WHERE "businessId" = ${businessId}
      `;
      
      const promocionesQuery = await prisma.$queryRaw`
        SELECT COUNT(*) as total,
               COUNT(CASE WHEN activo = true THEN 1 END) as activos  
        FROM "Promocion"
        WHERE "businessId" = ${businessId}
      `;
      
      const favoritosQuery = await prisma.$queryRaw`
        SELECT COUNT(*) as total,
               COUNT(CASE WHEN activo = true THEN 1 END) as activos
        FROM "FavoritoDelDia" 
        WHERE "businessId" = ${businessId}
      `;
      
      console.log(`📢 Banners: ${bannersQuery[0].total} total, ${bannersQuery[0].activos} activos`);
      console.log(`🎁 Promociones: ${promocionesQuery[0].total} total, ${promocionesQuery[0].activos} activos`);
      console.log(`⭐ Favoritos: ${favoritosQuery[0].total} total, ${favoritosQuery[0].activos} activos`);
      
      // Mostrar algunos ejemplos si existen
      if (bannersQuery[0].total > 0) {
        const ejemplosBanners = await prisma.banner.findMany({
          where: { businessId },
          select: { titulo: true, dia: true, activo: true, imagenUrl: true },
          take: 3
        });
        console.log('\n📢 EJEMPLOS DE BANNERS:');
        ejemplosBanners.forEach(b => {
          console.log(`   - "${b.titulo}" (${b.dia}) - Activo: ${b.activo} - Imagen: ${b.imagenUrl ? '✅' : '❌'}`);
        });
      }
      
    } catch (error) {
      console.error('❌ Error verificando datos específicos:', error.message);
    }

    // Día comercial actual
    console.log('\n🗓️ DÍA COMERCIAL ACTUAL:');
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

    console.log(`⏰ Hora actual: ${hour}:${now.getMinutes().toString().padStart(2, '0')}`);
    console.log(`📅 Día comercial: ${businessDay} (reseteo a las 4:00 AM)`);
    console.log(`📅 Día natural: ${dayNames[now.getDay()]}`);

  } catch (error) {
    console.error('❌ Error general:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verificarConfiguracion().catch(console.error);
