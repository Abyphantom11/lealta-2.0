/**
 * Script para diagnosticar por qué no se muestran los elementos en el portal del cliente
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function diagnosticarPortalCliente() {
  console.log('🔍 DIAGNÓSTICO: Portal del Cliente - Banners, Promociones y Favoritos');
  console.log('================================================================');

  try {
    // 1. Verificar negocios disponibles
    console.log('\n📊 NEGOCIOS DISPONIBLES:');
    const businesses = await prisma.business.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        isActive: true
      },
      take: 10
    });

    if (businesses.length === 0) {
      console.log('❌ No se encontraron negocios en la base de datos');
      return;
    }

    businesses.forEach((business, index) => {
      console.log(`${index + 1}. ${business.name} (${business.slug}) - ID: ${business.id} - Activo: ${business.isActive}`);
    });

    // 2. Verificar configuración de portal para cada negocio
    console.log('\n🎨 CONFIGURACIÓN DE PORTAL POR NEGOCIO:');
    
    for (const business of businesses.slice(0, 3)) { // Solo los primeros 3
      console.log(`\n--- ${business.name} (${business.id}) ---`);
      
      // Verificar banners
      let bannersCount = 0;
      let banners = [];
      try {
        bannersCount = await prisma.banner.count({
          where: { businessId: business.id }
        });
        
        banners = await prisma.banner.findMany({
          where: { businessId: business.id },
          select: {
            id: true,
            titulo: true,
            dia: true,
            horaPublicacion: true,
            activo: true,
            imagenUrl: true
          },
          take: 5
        });
      } catch (error) {
        console.log(`  ❌ Error consultando banners: ${error.message}`);
      }
      
      const banners = await prisma.banner.findMany({
        where: { businessId: business.id },
        select: {
          id: true,
          titulo: true,
          dia: true,
          horaPublicacion: true,
          activo: true,
          imagenUrl: true
        },
        take: 5
      });

      console.log(`📢 Banners: ${bannersCount} total`);
      if (banners.length > 0) {
        banners.forEach(b => {
          console.log(`  - ${b.titulo} (${b.dia}) - ${b.horaPublicacion} - Activo: ${b.activo} - Imagen: ${b.imagenUrl ? '✅' : '❌'}`);
        });
      }

      // Verificar promociones
      const promocionesCount = await prisma.promocion.count({
        where: { businessId: business.id }
      });
      
      const promociones = await prisma.promocion.findMany({
        where: { businessId: business.id },
        select: {
          id: true,
          titulo: true,
          dia: true,
          horaTermino: true,
          activo: true,
          imagenUrl: true
        },
        take: 5
      });

      console.log(`🎁 Promociones: ${promocionesCount} total`);
      if (promociones.length > 0) {
        promociones.forEach(p => {
          console.log(`  - ${p.titulo} (${p.dia}) - Hasta: ${p.horaTermino} - Activo: ${p.activo} - Imagen: ${p.imagenUrl ? '✅' : '❌'}`);
        });
      }

      // Verificar favoritos del día
      const favoritosCount = await prisma.favoritoDelDia.count({
        where: { businessId: business.id }
      });
      
      const favoritos = await prisma.favoritoDelDia.findMany({
        where: { businessId: business.id },
        select: {
          id: true,
          nombre: true,
          dia: true,
          horaPublicacion: true,
          activo: true,
          imagenUrl: true
        },
        take: 5
      });

      console.log(`⭐ Favoritos del día: ${favoritosCount} total`);
      if (favoritos.length > 0) {
        favoritos.forEach(f => {
          console.log(`  - ${f.nombre} (${f.dia}) - ${f.horaPublicacion} - Activo: ${f.activo} - Imagen: ${f.imagenUrl ? '✅' : '❌'}`);
        });
      }

      console.log(`📊 Resumen: ${bannersCount} banners, ${promocionesCount} promociones, ${favoritosCount} favoritos`);
    }

    // 3. Verificar día comercial actual
    console.log('\n🗓️ DÍA COMERCIAL ACTUAL:');
    const now = new Date();
    const hour = now.getHours();
    const dayNames = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
    
    let businessDay;
    if (hour < 4) {
      // Antes de las 4 AM = día anterior comercial
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      businessDay = dayNames[yesterday.getDay()];
    } else {
      // Después de las 4 AM = día actual comercial
      businessDay = dayNames[now.getDay()];
    }

    console.log(`⏰ Hora actual: ${hour}:${now.getMinutes().toString().padStart(2, '0')}`);
    console.log(`📅 Día comercial: ${businessDay}`);
    console.log(`📅 Día natural: ${dayNames[now.getDay()]}`);

    // 4. Recomendaciones
    console.log('\n💡 RECOMENDACIONES:');
    
    const totalElements = businesses.reduce(async (acc, business) => {
      const banners = await prisma.banner.count({ where: { businessId: business.id, activo: true } });
      const promociones = await prisma.promocion.count({ where: { businessId: business.id, activo: true } });
      const favoritos = await prisma.favoritoDelDia.count({ where: { businessId: business.id, activo: true } });
      return (await acc) + banners + promociones + favoritos;
    }, Promise.resolve(0));

    if ((await totalElements) === 0) {
      console.log('❌ NO HAY ELEMENTOS ACTIVOS CONFIGURADOS');
      console.log('✅ Solución: Ir al admin y configurar banners, promociones o favoritos del día');
      console.log('🔧 URL admin: http://localhost:3001/[businessId]/admin');
    } else {
      console.log('✅ Hay elementos configurados, revisar filtros de día y hora');
    }

  } catch (error) {
    console.error('❌ Error en diagnóstico:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar diagnóstico
diagnosticarPortalCliente().catch(console.error);
