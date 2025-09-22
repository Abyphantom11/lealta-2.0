// Script para limpiar banners de la base de datos
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clearBanners() {
  try {
    const businessId = 'cmfuhipwk0000eyrokxk7n89d';
    
    console.log('🔍 Buscando banners en BD para business:', businessId);
    const banners = await prisma.portalBanner.findMany({
      where: { businessId }
    });
    
    console.log('📊 Banners encontrados:', banners.length);
    banners.forEach(banner => {
      console.log(`  - ${banner.dia}: ${banner.titulo} (${banner.active ? 'activo' : 'inactivo'})`);
    });
    
    if (banners.length > 0) {
      console.log('🧹 Eliminando banners de BD...');
      const result = await prisma.portalBanner.deleteMany({
        where: { businessId }
      });
      console.log('✅ Eliminados:', result.count, 'banners');
    } else {
      console.log('ℹ️ No hay banners que eliminar');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

clearBanners();
