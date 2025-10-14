// Script para verificar datos en PostgreSQL
console.log('🔍 Verificando datos en PostgreSQL...\n');

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const businessId = 'cmfqhepmq0000ey4slyms4knv'; // casa-sabor-demo

async function checkDatabase() {
  try {
    console.log(`🗄️ Verificando datos para business: ${businessId}\n`);
    
    // Verificar banners
    const banners = await prisma.portalBanner.findMany({
      where: { businessId }
    });
    console.log(`📋 Banners encontrados: ${banners.length}`);
    if (banners.length > 0) {
      console.log('   Primeros banners:');
      banners.slice(0, 3).forEach((banner, i) => {
        console.log(`   ${i + 1}. ${banner.title} (${banner.active ? 'activo' : 'inactivo'})`);
      });
    }
    
    // Verificar promociones
    const promociones = await prisma.portalPromocion.findMany({
      where: { businessId }
    });
    console.log(`\n🔥 Promociones encontradas: ${promociones.length}`);
    if (promociones.length > 0) {
      console.log('   Primeras promociones:');
      promociones.slice(0, 5).forEach((promo, i) => {
        console.log(`   ${i + 1}. ${promo.title} - ${promo.description} (${promo.active ? 'activa' : 'inactiva'})`);
      });
    }
    
    // Verificar recompensas
    const recompensas = await prisma.portalRecompensa.findMany({
      where: { businessId }
    });
    console.log(`\n🎁 Recompensas encontradas: ${recompensas.length}`);
    if (recompensas.length > 0) {
      console.log('   Primeras recompensas:');
      recompensas.slice(0, 3).forEach((recompensa, i) => {
        console.log(`   ${i + 1}. ${recompensa.title} - ${recompensa.pointsCost} puntos (${recompensa.active ? 'activa' : 'inactiva'})`);
      });
    }
    
    // Verificar favorito del día
    const favoritos = await prisma.portalFavoritoDelDia.findMany({
      where: { businessId }
    });
    console.log(`\n⭐ Favoritos del día encontrados: ${favoritos.length}`);
    if (favoritos.length > 0) {
      console.log('   Primeros favoritos:');
      favoritos.slice(0, 3).forEach((favorito, i) => {
        console.log(`   ${i + 1}. ${favorito.productName} (${favorito.active ? 'activo' : 'inactivo'})`);
      });
    }
    
    // Verificar configuración general
    const config = await prisma.portalConfig.findUnique({
      where: { businessId }
    });
    console.log(`\n⚙️ Configuración del portal: ${config ? 'encontrada' : 'no encontrada'}`);
    if (config) {
      console.log(`   - Título promociones: ${config.promocionesTitle || 'default'}`);
      console.log(`   - Título recompensas: ${config.recompensasTitle || 'default'}`);
    }
    
    if (promociones.length === 0) {
      console.log('\n❌ PROBLEMA IDENTIFICADO:');
      console.log('   No hay promociones en PostgreSQL para este business');
      console.log('   💡 Posibles causas:');
      console.log('      1. Admin nunca guardó promociones en PostgreSQL');
      console.log('      2. BusinessId incorrecto');
      console.log('      3. Promociones están en JSON files pero no en BD');
    } else {
      console.log('\n✅ DATOS ENCONTRADOS EN POSTGRESQL');
      console.log('   El endpoint config-v2 debería funcionar correctamente');
    }
    
  } catch (error) {
    console.error('❌ Error verificando base de datos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
