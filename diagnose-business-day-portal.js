/**
 * 🔍 DIAGNÓSTICO CORREGIDO: Portal Cliente con Lógica de Día Comercial
 * Usa la misma lógica de business-day-utils.ts para simular el comportamiento correcto
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// 🎯 LÓGICA DE DÍA COMERCIAL (copiada de business-day-utils.ts)
function getCurrentBusinessDay(resetHour = 4) {
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

async function diagnoseWithBusinessDay() {
  console.log('🔍 DIAGNÓSTICO CON LÓGICA DE DÍA COMERCIAL');
  console.log('='.repeat(50));
  
  try {
    const businessId = 'cmgf5px5f0000eyy0elci9yds';
    
    // 1. INFORMACIÓN DE TIEMPO
    console.log('\n⏰ INFORMACIÓN DE TIEMPO');
    console.log('-'.repeat(30));
    
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const naturalDay = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'][now.getDay()];
    const businessDay = getCurrentBusinessDay(4);
    
    console.log(`🕒 Hora actual: ${currentHour}:${currentMinute.toString().padStart(2, '0')}`);
    console.log(`📅 Día natural: ${naturalDay}`);
    console.log(`🏢 Día comercial (reset 4:00 AM): ${businessDay}`);
    console.log(`⚡ Cambio de día comercial ${currentHour < 4 ? 'en' : 'dentro de'} ${currentHour < 4 ? (4 - currentHour) : (24 - currentHour + 4)} horas`);
    
    // 2. DATOS EN BASE DE DATOS
    console.log('\n📊 DATOS EN BASE DE DATOS');
    console.log('-'.repeat(30));
    
    const banners = await prisma.portalBanner.findMany({
      where: { businessId },
      select: {
        id: true,
        title: true,
        active: true,
        dia: true,
        imageUrl: true
      }
    });
    
    const promociones = await prisma.portalPromocion.findMany({
      where: { businessId },
      select: {
        id: true,
        title: true,
        active: true,
        dia: true,
        imageUrl: true
      }
    });
    
    const favoritos = await prisma.portalFavoritoDelDia.findMany({
      where: { businessId },
      select: {
        id: true,
        productName: true,
        active: true,
        dia: true,
        imageUrl: true
      }
    });
    
    console.log(`📢 Banners totales: ${banners.length}`);
    console.log(`🎁 Promociones totales: ${promociones.length}`);
    console.log(`⭐ Favoritos totales: ${favoritos.length}`);
    
    // 3. FILTRADO POR DÍA COMERCIAL (LO QUE DEBERÍA MOSTRARSE AHORA)
    console.log('\n🎯 CONTENIDO QUE DEBERÍA MOSTRARSE AHORA');
    console.log('-'.repeat(45));
    console.log(`🏢 Filtrando por día comercial: ${businessDay}`);
    
    // Filtrar usando la misma lógica que usa el frontend
    const bannersVisibles = banners.filter(banner => 
      banner.active && 
      banner.imageUrl && 
      banner.imageUrl.trim() !== '' &&
      (!banner.dia || banner.dia === businessDay)
    );
    
    const promocionesVisibles = promociones.filter(promo => 
      promo.active && 
      promo.imageUrl && 
      promo.imageUrl.trim() !== '' &&
      (!promo.dia || promo.dia === businessDay)
    );
    
    const favoritosVisibles = favoritos.filter(fav => 
      fav.active && 
      fav.imageUrl && 
      fav.imageUrl.trim() !== '' &&
      (!fav.dia || fav.dia === businessDay)
    );
    
    console.log(`\n📢 Banners QUE DEBERÍAN MOSTRARSE: ${bannersVisibles.length}`);
    if (bannersVisibles.length > 0) {
      bannersVisibles.forEach((banner, idx) => {
        console.log(`   ${idx + 1}. "${banner.title}" (día: ${banner.dia || 'cualquiera'})`);
      });
    } else {
      console.log('   ❌ No hay banners para mostrar');
    }
    
    console.log(`\n🎁 Promociones QUE DEBERÍAN MOSTRARSE: ${promocionesVisibles.length}`);
    if (promocionesVisibles.length > 0) {
      promocionesVisibles.forEach((promo, idx) => {
        console.log(`   ${idx + 1}. "${promo.title}" (día: ${promo.dia || 'cualquiera'})`);
      });
    } else {
      console.log('   ❌ No hay promociones para mostrar');
      
      // Mostrar por qué no se muestran
      if (promociones.length > 0) {
        console.log('\n   🔍 Promociones disponibles pero no visibles:');
        promociones.forEach(promo => {
          const reasons = [];
          if (!promo.active) reasons.push('inactiva');
          if (!promo.imageUrl || promo.imageUrl.trim() === '') reasons.push('sin imagen');
          if (promo.dia && promo.dia !== businessDay) reasons.push(`día ${promo.dia} ≠ ${businessDay}`);
          
          console.log(`      - "${promo.title}": ${reasons.join(', ')}`);
        });
      }
    }
    
    console.log(`\n⭐ Favoritos QUE DEBERÍAN MOSTRARSE: ${favoritosVisibles.length}`);
    if (favoritosVisibles.length > 0) {
      favoritosVisibles.forEach((fav, idx) => {
        console.log(`   ${idx + 1}. "${fav.productName}" (día: ${fav.dia || 'cualquiera'})`);
      });
    } else {
      console.log('   ❌ No hay favoritos para mostrar');
    }
    
    // 4. ANÁLISIS DEL PROBLEMA
    console.log('\n🚨 ANÁLISIS DEL PROBLEMA EN PRODUCCIÓN');
    console.log('-'.repeat(45));
    
    if (bannersVisibles.length === 0 && promocionesVisibles.length === 0 && favoritosVisibles.length === 0) {
      console.log('❌ PROBLEMA IDENTIFICADO: No hay contenido visible');
      console.log('\nPosibles causas:');
      console.log('1. 🔄 Frontend usando día natural en lugar de día comercial');
      console.log('2. 🌐 API no implementando correctamente la lógica de business day');
      console.log('3. 🏢 useAutoRefreshPortalConfig no usando getCurrentBusinessDay()');
      console.log('4. 🖼️ Problemas con URLs de imágenes');
    } else {
      console.log('✅ HAY CONTENIDO QUE DEBERÍA MOSTRARSE');
      console.log('\nSi no se muestra en producción, verificar:');
      console.log('1. 🌐 API /api/portal/config-v2 devuelve datos correctos');
      console.log('2. 🔄 Frontend aplica filtros de día comercial correctamente');
      console.log('3. 🖼️ URLs de imágenes son accesibles en producción');
    }
    
    // 5. SCRIPT DE PRUEBA PARA CONSOLA
    console.log('\n🧪 SCRIPT PARA PROBAR EN CONSOLA DE PRODUCCIÓN');
    console.log('-'.repeat(55));
    
    console.log('Ejecuta esto en la consola del navegador:');
    console.log('\n```javascript');
    console.log('// Función para obtener día comercial');
    console.log('function getCurrentBusinessDay(resetHour = 4) {');
    console.log('  const now = new Date();');
    console.log('  const currentHour = now.getHours();');
    console.log('  if (currentHour < resetHour) {');
    console.log('    const yesterday = new Date(now);');
    console.log('    yesterday.setDate(yesterday.getDate() - 1);');
    console.log('    return ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"][yesterday.getDay()];');
    console.log('  }');
    console.log('  return ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"][now.getDay()];');
    console.log('}');
    console.log('');
    console.log('// Verificar día comercial actual');
    console.log('const businessDay = getCurrentBusinessDay();');
    console.log('console.log("Día comercial actual:", businessDay);');
    console.log('');
    console.log('// Probar API');
    console.log(`fetch('/api/portal/config-v2?businessId=${businessId}')`);
    console.log('  .then(r => r.json())');
    console.log('  .then(data => {');
    console.log('    console.log("=== DATOS DE API ===");');
    console.log('    console.log("Banners totales:", data.banners?.length || 0);');
    console.log('    console.log("Promociones totales:", data.promociones?.length || 0);');
    console.log('    console.log("Favorito del día:", data.favoritoDelDia ? "Sí" : "No");');
    console.log('    ');
    console.log('    // Filtrar banners para día comercial actual');
    console.log('    const bannersVisibles = (data.banners || []).filter(b => ');
    console.log('      b.activo && b.imagenUrl && (!b.dia || b.dia === businessDay)');
    console.log('    );');
    console.log('    console.log("Banners visibles para", businessDay + ":", bannersVisibles.length);');
    console.log('    ');
    console.log('    // Filtrar promociones');
    console.log('    const promocionesVisibles = (data.promociones || []).filter(p => ');
    console.log('      p.activo && p.imagenUrl && (!p.dia || p.dia === businessDay)');
    console.log('    );');
    console.log('    console.log("Promociones visibles para", businessDay + ":", promocionesVisibles.length);');
    console.log('    ');
    console.log('    console.log("=== RESULTADO ===");');
    console.log('    if (bannersVisibles.length > 0 || promocionesVisibles.length > 0) {');
    console.log('      console.log("✅ CONTENIDO DISPONIBLE - Problema en el frontend");');
    console.log('    } else {');
    console.log('      console.log("❌ SIN CONTENIDO - Problema en datos o API");');
    console.log('    }');
    console.log('  })');
    console.log('  .catch(error => {');
    console.log('    console.error("❌ Error en API:", error);');
    console.log('  });');
    console.log('```');
    
    // 6. CONCLUSIÓN
    console.log('\n🎯 CONCLUSIÓN');
    console.log('-'.repeat(15));
    
    if (bannersVisibles.length > 0 || promocionesVisibles.length > 0 || favoritosVisibles.length > 0) {
      console.log('✅ DATOS CORRECTOS: Hay contenido que debería mostrarse');
      console.log('🔍 El problema está en el FRONTEND o en las APIS');
      console.log('📋 Verificar que useAutoRefreshPortalConfig use lógica de día comercial');
    } else {
      console.log('❌ SIN CONTENIDO VÁLIDO para el día comercial actual');
      console.log('🛠️ Crear contenido con imágenes para el día actual desde el admin');
    }
    
  } catch (error) {
    console.error('❌ Error en diagnóstico:', error);
  } finally {
    await prisma.$disconnect();
  }
}

diagnoseWithBusinessDay().catch(console.error);
