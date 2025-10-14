// Script para limpiar los datos hardcodeados y dejar que el admin configure datos reales
const { PrismaClient } = require('@prisma/client');

async function cleanHardcodedData() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🧹 LIMPIANDO DATOS HARDCODEADOS DEL PORTAL');
    console.log('='.repeat(60));
    
    const businessId = 'cmgf5px5f0000eyy0elci9yds'; // Casa Sabor Demo
    
    // 1. Mostrar datos actuales antes de eliminar
    const currentBanners = await prisma.portalBanner.findMany({
      where: { businessId }
    });
    
    const currentPromociones = await prisma.portalPromocion.findMany({
      where: { businessId }
    });
    
    console.log(`📊 DATOS ACTUALES A ELIMINAR:`);
    console.log(`   Banners: ${currentBanners.length}`);
    currentBanners.forEach(banner => {
      console.log(`   - "${banner.title}" (${banner.active ? 'activo' : 'inactivo'})`);
    });
    
    console.log(`   Promociones: ${currentPromociones.length}`);
    currentPromociones.forEach(promo => {
      console.log(`   - "${promo.title}" (${promo.active ? 'activo' : 'inactivo'})`);
    });
    
    // 2. Eliminar TODOS los banners hardcodeados
    const deletedBanners = await prisma.portalBanner.deleteMany({
      where: { businessId }
    });
    
    // 3. Eliminar TODAS las promociones hardcodeadas
    const deletedPromociones = await prisma.portalPromocion.deleteMany({
      where: { businessId }
    });
    
    console.log(`\n✅ DATOS ELIMINADOS:`);
    console.log(`   Banners eliminados: ${deletedBanners.count}`);
    console.log(`   Promociones eliminadas: ${deletedPromociones.count}`);
    
    // 4. Verificar que la base está limpia
    const remainingBanners = await prisma.portalBanner.findMany({
      where: { businessId }
    });
    
    const remainingPromociones = await prisma.portalPromocion.findMany({
      where: { businessId }
    });
    
    console.log(`\n🔍 VERIFICACIÓN POST-LIMPIEZA:`);
    console.log(`   Banners restantes: ${remainingBanners.length}`);
    console.log(`   Promociones restantes: ${remainingPromociones.length}`);
    
    if (remainingBanners.length === 0 && remainingPromociones.length === 0) {
      console.log(`\n🎯 ¡PERFECTO! Base de datos limpia.`);
      console.log(`\n📝 SIGUIENTE PASO:`);
      console.log(`1. Ve al admin del portal del cliente`);
      console.log(`2. Crea banners y promociones REALES desde la interfaz`);
      console.log(`3. Los datos aparecerán correctamente en el portal del cliente`);
      console.log(`\n🔗 URL del admin: http://localhost:3000/cmgf5px5f0000eyy0elci9yds/admin`);
    } else {
      console.log(`\n⚠️ Algunos datos no se eliminaron correctamente`);
    }
    
  } catch (error) {
    console.error('❌ Error limpiando datos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanHardcodedData().catch(console.error);
