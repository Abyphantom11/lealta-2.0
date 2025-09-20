// Test para verificar si los datos del portal están en la base de datos
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testPortalConfigurations() {
  try {
    console.log('🔍 Analizando configuraciones del portal...');
    
    const correctBusinessId = 'cmfr2y0ia0000eyvw7ef3k20u';
    console.log(`\n📋 Buscando datos para businessId: ${correctBusinessId}`);
    
    // 1. BANNERS
    const banners = await prisma.portalBanner.findMany({
      where: { businessId: correctBusinessId }
    });
    console.log('\n🏷️ PORTAL BANNERS:');
    console.log(`  Encontrados: ${banners.length} banners`);
    if (banners.length > 0) {
      banners.forEach((banner, i) => {
        console.log(`    ${i+1}. "${banner.titulo}" (${banner.dia}) - Activo: ${banner.activo}`);
      });
    } else {
      console.log('  ❌ No hay banners configurados');
    }

    // 2. PROMOCIONES
    const promociones = await prisma.portalPromocion.findMany({
      where: { businessId: correctBusinessId }
    });
    console.log('\n🎁 PORTAL PROMOCIONES:');
    console.log(`  Encontradas: ${promociones.length} promociones`);
    if (promociones.length > 0) {
      promociones.forEach((promo, i) => {
        console.log(`    ${i+1}. "${promo.titulo}" (${promo.dia}) - Activa: ${promo.activa}`);
      });
    } else {
      console.log('  ❌ No hay promociones configuradas');
    }

    // 3. RECOMPENSAS
    const recompensas = await prisma.portalRecompensa.findMany({
      where: { businessId: correctBusinessId }
    });
    console.log('\n🎁 PORTAL RECOMPENSAS:');
    console.log(`  Encontradas: ${recompensas.length} recompensas`);
    if (recompensas.length > 0) {
      recompensas.forEach((recompensa, i) => {
        console.log(`    ${i+1}. "${recompensa.title}" - ${recompensa.pointsCost} puntos - Activa: ${recompensa.active}`);
      });
    } else {
      console.log('  ❌ No hay recompensas configuradas');
    }

    // 4. FAVORITOS DEL DÍA
    const favoritos = await prisma.portalFavoritoDelDia.findMany({
      where: { businessId: correctBusinessId }
    });
    console.log('\n⭐ FAVORITOS DEL DÍA:');
    console.log(`  Encontrados: ${favoritos.length} favoritos`);
    if (favoritos.length > 0) {
      favoritos.forEach((fav, i) => {
        console.log(`    ${i+1}. "${fav.productName}" (${fav.dia}) - Activo: ${fav.active}`);
      });
    } else {
      console.log('  ❌ No hay favoritos del día configurados');
    }

    // 5. BRANDING (ya sabemos que funciona)
    const branding = await prisma.brandingConfig.findUnique({
      where: { businessId: correctBusinessId }
    });
    console.log('\n🎨 BRANDING CONFIG:');
    if (branding) {
      console.log(`  ✅ Configurado: "${branding.businessName}" - ${branding.primaryColor}`);
    } else {
      console.log('  ❌ No configurado');
    }

    console.log('\n📊 RESUMEN PROBLEMA:');
    console.log(`  - Banners: ${banners.length > 0 ? '✅ DATOS EXISTEN' : '❌ SIN DATOS'}`);
    console.log(`  - Promociones: ${promociones.length > 0 ? '✅ DATOS EXISTEN' : '❌ SIN DATOS'}`);
    console.log(`  - Recompensas: ${recompensas.length > 0 ? '✅ DATOS EXISTEN' : '❌ SIN DATOS'}`);
    console.log(`  - Favoritos: ${favoritos.length > 0 ? '✅ DATOS EXISTEN' : '❌ SIN DATOS'}`);
    console.log(`  - Branding: ${branding ? '✅ DATOS EXISTEN (SOLUCIONADO)' : '❌ SIN DATOS'}`);

    if (banners.length === 0 && promociones.length === 0 && recompensas.length === 0 && favoritos.length === 0) {
      console.log('\n🎯 DIAGNÓSTICO: Si todos están vacíos, el problema puede ser:');
      console.log('  1. Los datos nunca se crearon');
      console.log('  2. Se crearon con businessId incorrecto');
      console.log('  3. Se borraron accidentalmente');
    } else {
      console.log('\n🎯 DIAGNÓSTICO: Si hay datos pero no aparecen en admin, el problema es el mismo que branding');
      console.log('  - fetchConfig está usando businessId incorrecto para cargar datos');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testPortalConfigurations();
